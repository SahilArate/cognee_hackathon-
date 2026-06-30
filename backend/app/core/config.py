from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, sourced from environment variables.

    Loaded once and cached for the lifetime of the process so we don't
    re-read the environment on every request.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # LLM provider
    llm_provider: str = "custom"
    llm_model: str = "xai/grok-4"
    llm_api_key: str
    llm_endpoint: str = "https://api.x.ai/v1"

    # Embeddings (local, no API key required)
    embedding_provider: str = "fastembed"
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dimensions: int = 384

    # Cognee local storage roots
    cognee_system_root: str = ".cognee_system"
    cognee_data_root: str = ".cognee_data"

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # CORS
    frontend_origin: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()