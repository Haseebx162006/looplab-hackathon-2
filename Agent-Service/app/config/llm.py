import time
import logging
import litellm
from app.config.settings import settings

logger = logging.getLogger("app")

# Note: Groq model names change over time.
# Check https://console.groq.com/docs/models if all fallbacks start failing.

def call_llm_with_fallback(
    prompt: str,
    response_format: dict = None,
    temperature: float = None,
    system_prompt: str = None,
    max_tokens: int = 4096,
) -> str:
    """
    Call LiteLLM completion with automatic model fallback and rate-limit retries.
    
    Args:
        prompt: The user prompt to send to the LLM.
        response_format: Optional response format (e.g. {"type": "json_object"}).
        temperature: Optional sampling temperature.
        system_prompt: Optional system message.
        max_tokens: Max completion tokens.
    
    Returns:
        The LLM response content as a string.
    
    Raises:
        RuntimeError: If all fallback models fail.
    """
    models = settings.groq_models_list
    if not models:
        models = [
            "groq/openai/gpt-oss-20b",
            "groq/openai/gpt-oss-120b",
            "groq/qwen/qwen3.6-27b"
        ]
    
    # Token estimation check
    estimated_tokens = len(prompt) // 4
    if estimated_tokens > 5000:
        logger.warning(
            f"Estimated prompt size ({estimated_tokens} tokens) is close to Groq TPM limit."
        )
        
    errors = []
    for model in models:
        # Try same model up to 2 times if rate limited
        attempts = 2
        for attempt in range(attempts):
            try:
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                kwargs = {
                    "model": model,
                    "messages": messages,
                    "api_key": settings.GROQ_API_KEY,
                    "response_format": response_format,
                    "max_tokens": max_tokens,
                    "drop_params": True,
                }
                if temperature is not None:
                    kwargs["temperature"] = temperature
                response = litellm.completion(**kwargs)
                return response.choices[0].message.content or "{}"
            except litellm.RateLimitError as e:
                err_type = "rate_limit"
                logger.warning(
                    f"Model {model} hit rate limit (attempt {attempt + 1}/{attempts}): {e}"
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
                    f"Model {model} failed with {err_type}: {e}"
                )
                errors.append(f"{model} ({err_type}): {str(e)}")
                break
                
    raise RuntimeError(f"All fallback models failed. Details:\n" + "\n".join(errors))
