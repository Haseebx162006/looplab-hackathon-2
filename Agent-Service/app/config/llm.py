import logging
from crewai import LLM
from app.config.settings import settings

logger = logging.getLogger("app")

# Note: Groq model names change over time.
# Check https://console.groq.com/docs/models if all fallbacks start failing.

class FallbackLLM(LLM):
    """
    Custom CrewAI LLM wrapper that supports automatic failover.
    If the primary model is decommissioned or not found, it falls back
    to the next model in the specified model list.
    """
    def __new__(cls, models: list, **kwargs):
        if not models:
            raise ValueError("models list cannot be empty")
        # Strip models out and call the parent constructor with the first model
        instance = super().__new__(cls, model=models[0], **kwargs)
        return instance

    def __init__(self, models: list, **kwargs):
        # Set private state variables bypassing Pydantic attributes check
        object.__setattr__(self, "_models_list", models)
        object.__setattr__(self, "_current_model_idx", 0)
        
    def call(self, messages, callbacks=None, **kwargs):
        while self._current_model_idx < len(self._models_list):
            model = self._models_list[self._current_model_idx]
            object.__setattr__(self, "model", model)
            try:
                # Call the parent CrewAI LLM class
                return super().call(messages, callbacks=callbacks, **kwargs)
            except Exception as e:
                err_msg = str(e).lower()
                # Check for model not found / decommissioned / invalid model error
                is_model_error = any(kw in err_msg for kw in [
                    "does not exist", "not found", "decommissioned", "invalid model", 
                    "unknown model", "not support", "unsupported", "invalid_request_error"
                ])
                if is_model_error and self._current_model_idx + 1 < len(self._models_list):
                    next_model = self._models_list[self._current_model_idx + 1]
                    logger.warning(
                        f"Model {model} failed with model error: {e}. "
                        f"Trying next fallback model: {next_model}"
                    )
                    object.__setattr__(self, "_current_model_idx", self._current_model_idx + 1)
                else:
                    # Let other errors (e.g. rate limit, auth) bubble up normally
                    raise e
        raise RuntimeError("All configured fallback models failed.")

def get_llm_client() -> FallbackLLM:
    """
    Centralized factory function to initialize the fallback-aware LLM client.
    """
    return FallbackLLM(
        models=settings.groq_models_list,
        api_key=settings.GROQ_API_KEY,
        max_retries=5,
        max_tokens=8192,
        drop_params=True,
        additional_drop_params=["cache_breakpoint"]
    )
