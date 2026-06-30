import cognee
from cognee.modules.search.types import SearchType
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ingestion import remember_codebase

router = APIRouter()


class IngestRequest(BaseModel):
    repo_path: str


class IngestResponse(BaseModel):
    files_remembered: int
    commits_remembered: int
    docs_remembered: int


@router.post("/ingest", response_model=IngestResponse)
async def ingest_repository(request: IngestRequest) -> IngestResponse:
    try:
        result = await remember_codebase(request.repo_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    await cognee.cognify()

    return IngestResponse(**result)


class SearchRequest(BaseModel):
    question: str


class SearchResponse(BaseModel):
    answer: str


@router.post("/search", response_model=SearchResponse)
async def search_codebase(request: SearchRequest) -> SearchResponse:
    results = await cognee.search(
        query_text=request.question,
        query_type=SearchType.GRAPH_COMPLETION,
    )

    if not results:
        return SearchResponse(answer="No relevant context was found in memory yet.")

    return SearchResponse(answer=str(results[0]))


class FeedbackRequest(BaseModel):
    question: str
    answer: str
    was_helpful: bool


@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest) -> dict:
    """Record developer feedback so Cognee can sharpen its understanding
    of this specific codebase over time, rather than treating every
    question as a cold start.

    cognee.improve() operates at the dataset level rather than on a
    single answer, so the feedback itself is first written into memory
    as its own fact, then improve() is triggered to let Cognee
    reprocess the dataset with that new signal folded in.
    """
    verdict = "confirmed correct" if request.was_helpful else "flagged as incorrect"
    feedback_note = (
        f"# feedback: developer {verdict} this answer\n"
        f"Question: {request.question}\n"
        f"Answer: {request.answer}"
    )
    await cognee.remember(feedback_note)
    await cognee.improve()

    return {"status": "recorded"}