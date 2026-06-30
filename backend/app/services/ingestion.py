from pathlib import Path

import cognee
from git import Repo

# File extensions we treat as source code worth understanding deeply.
# Kept narrow on purpose - Cognee's code graph pipeline is built and
# tested against Python, so that's where ingestion quality is highest.
CODE_EXTENSIONS = {".py"}

# Anything matching these directory names is skipped during ingestion -
# build artifacts and dependency folders add noise, not understanding.
IGNORED_DIRS = {".git", "__pycache__", "venv", ".venv", "node_modules", "dist", "build"}


def _iter_source_files(repo_path: Path):
    for path in repo_path.rglob("*"):
        if path.is_dir():
            continue
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        if path.suffix in CODE_EXTENSIONS:
            yield path


async def remember_codebase(repo_path: str) -> dict:
    """Ingest a target repository into Cognee memory.

    Three distinct sources are remembered, each carrying context a
    standard code-completion tool never sees:
      1. Source files themselves, tagged with their relative path
      2. Git commit history, which captures *why* a change was made
      3. Any README/markdown docs, which capture intended behaviour

    Returns a small summary so the caller can report progress back to
    the user without needing to know Cognee's internals.
    """
    path = Path(repo_path).resolve()
    if not path.exists():
        raise FileNotFoundError(f"Repository path does not exist: {path}")

    file_count = 0
    for source_file in _iter_source_files(path):
        relative_path = source_file.relative_to(path)
        content = source_file.read_text(encoding="utf-8", errors="ignore")
        await cognee.remember(
            content,
            metadata={"source": str(relative_path), "kind": "source_code"},
        )
        file_count += 1

    commit_count = 0
    try:
        repo = Repo(path)
        for commit in repo.iter_commits(max_count=500):
            message = f"Commit {commit.hexsha[:8]} by {commit.author.name}: {commit.message.strip()}"
            await cognee.remember(
                message,
                metadata={"source": "git_history", "kind": "commit", "sha": commit.hexsha},
            )
            commit_count += 1
    except Exception:
        # Not every target will be a git repo (e.g. an extracted zip).
        # Missing history shouldn't block code ingestion.
        commit_count = 0

    doc_count = 0
    for doc_file in path.rglob("*.md"):
        if any(part in IGNORED_DIRS for part in doc_file.parts):
            continue
        relative_path = doc_file.relative_to(path)
        content = doc_file.read_text(encoding="utf-8", errors="ignore")
        await cognee.remember(
            content,
            metadata={"source": str(relative_path), "kind": "documentation"},
        )
        doc_count += 1

    return {
        "files_remembered": file_count,
        "commits_remembered": commit_count,
        "docs_remembered": doc_count,
    }