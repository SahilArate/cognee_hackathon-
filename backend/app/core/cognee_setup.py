import cognee

from app.core.config import Settings


def configure_cognee(settings: Settings) -> None:
    """Wire Cognee's provider config to our application settings.

    Cognee reads its own provider configuration through a mix of environment
    variables and direct config calls. We centralize that here so the rest
    of the app never has to know how Cognee is wired internally - it just
    calls configure_cognee() once at startup and trusts it's ready.
    """
    cognee.config.set_llm_config(
        {
            "llm_provider": settings.llm_provider,
            "llm_model": settings.llm_model,
            "llm_api_key": settings.llm_api_key,
            "llm_endpoint": settings.llm_endpoint,
        }
    )

    cognee.config.set_embedding_config(
        {
            "embedding_provider": settings.embedding_provider,
            "embedding_model": settings.embedding_model,
            "embedding_dimensions": settings.embedding_dimensions,
        }
    )

    cognee.config.system_root_directory(settings.cognee_system_root)
    cognee.config.data_root_directory(settings.cognee_data_root)