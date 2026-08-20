import time
import logging
import litellm
from crewai import LLM
from app.config.settings import settings

logger = logging.getLogger("app")

# Note: Groq model names change over time.
# Check https://console.groq.com/docs/models if all fallbacks start failing.

def get_llm_client(model_name: str) -> LLM:
    """
    Factory to return a standard, clean crewai.LLM instance for the specified model.
    """
    return LLM(
        model=model_name,
        api_key=settings.GROQ_API_KEY,
        max_retries=5,
        max_tokens=8192,
        drop_params=True,
        additional_drop_params=["cache_breakpoint"]
    )

def call_llm_with_fallback(prompt: str, response_format: dict = None) -> str:
    """
    Call LiteLLM completion with automatic fallback and rate-limit retries.
    """
    models = settings.groq_models_list
    if not models:
        models = [
            "groq/openai/gpt-oss-20b",
            "groq/openai/gpt-oss-120b",
            "groq/qwen/qwen3.6-27b"
        ]
        
    errors = []
    for model in models:
        # Try same model up to 2 times if rate limited
        attempts = 2
        for attempt in range(attempts):
            try:
                response = litellm.completion(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    api_key=settings.GROQ_API_KEY,
                    response_format=response_format,
                    max_tokens=8192
                )
                return response.choices[0].message.content or "{}"
            except litellm.RateLimitError as e:
                err_type = "rate_limit"
                logger.warning(
                    f"Model {model} hit rate limit (attempt {attempt + 1}/{attempts}): {e}. "
                )
                if attempt + 1 < attempts:
                    time.sleep(2)
                    continue
                else:
                    errors.append(f"{model} ({err_type}): {str(e)}")
            except Exception as e:
                err_msg = str(e).lower()
                is_model_error = any(kw in err_msg for kw in [
                    "does not exist", "not found", "decommissioned", "invalid model", 
                    "unknown model", "not support", "unsupported", "invalid_request_error"
                ])
                err_type = "model_error" if is_model_error else "other_error"
                logger.warning(
                    f"Model {model} failed with {err_type}: {e}."
                )
                errors.append(f"{model} ({err_type}): {str(e)}")
                break
                
    raise RuntimeError(f"All fallback models failed. Details:\n" + "\n".join(errors))

def run_crew_with_fallback(crew_factory_func) -> str:
    """
    Executes a CrewAI kickoff with automatic fallback and rate-limit retries.
    Takes a factory function `crew_factory_func(llm)` that returns a Crew instance.
    """
    models = settings.groq_models_list
    if not models:
        models = [
            "groq/openai/gpt-oss-20b",
            "groq/openai/gpt-oss-120b",
            "groq/qwen/qwen3.6-27b"
        ]
        
    errors = []
    for model in models:
        attempts = 2
        for attempt in range(attempts):
            try:
                # 1. Create standard CrewAI LLM instance
                llm = get_llm_client(model)
                
                # 2. Get Crew instance from factory function
                crew = crew_factory_func(llm)
                
                # 3. Kick off the crew execution
                result = crew.kickoff()
                return str(result)
            except Exception as e:
                err_msg = str(e).lower()
                is_rate_limit = any(kw in err_msg for kw in ["rate limit", "rate_limit", "429", "too many requests"])
                is_model_error = any(kw in err_msg for kw in [
                    "does not exist", "not found", "decommissioned", "invalid model", 
                    "unknown model", "not support", "unsupported", "invalid_request_error"
                ])
                err_type = "rate_limit" if is_rate_limit else ("model_error" if is_model_error else "other_error")
                
                logger.warning(
                    f"Crew execution failed with model {model} (attempt {attempt + 1}/{attempts}) due to {err_type}: {e}"
                )
                
                if is_rate_limit and attempt + 1 < attempts:
                    time.sleep(2)
                    continue
                else:
                    errors.append(f"{model} ({err_type}): {str(e)}")
                    break
                    
    raise RuntimeError(f"All fallback models failed for Crew execution. Details:\n" + "\n".join(errors))
