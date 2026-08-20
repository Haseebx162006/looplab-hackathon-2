import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    GROQ_MODELS: str = "groq/openai/gpt-oss-120b,groq/openai/gpt-oss-20b,groq/qwen/qwen3.6-27b"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    NODE_ENV: str = "production"

    @property
    def groq_models_list(self) -> list:
        return [m.strip() for m in self.GROQ_MODELS.split(",") if m.strip()]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
