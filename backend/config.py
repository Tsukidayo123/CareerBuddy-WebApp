from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CareerBuddy"
    secret_key: str = "change-me-in-prod"
    access_token_expire_minutes: int = 60 * 24
    sqlalchemy_database_url: str = "sqlite:///./careerbuddy.db"
    cors_origins: list[str] = ["*"]

    model_config = {"env_file": ".env"}


settings = Settings() 


