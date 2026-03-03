from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    bot_token: str = Field(..., alias="BOT_TOKEN")
    database_url: str = Field("sqlite+aiosqlite:///./shop.db", alias="DATABASE_URL")
    webapp_url: str = Field("http://localhost:5173", alias="WEBAPP_URL")
    debug: bool = Field(True, alias="DEBUG")
    payment_provider_token: str = Field("", alias="PAYMENT_PROVIDER_TOKEN")
    admin_secret: str = Field("changeme", alias="ADMIN_SECRET")
    admin_group_id: str | int = Field("282311426", alias="ADMIN_GROUP_ID")

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
