from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.models.base import Base
import app.models.auth  # noqa: F401 - register auth models on Base
import app.models.hosted_zone  # noqa: F401 - register hosted_zone model on Base
import app.models.dns_record  # noqa: F401 - register dns_record model on Base
from app.core.seed import seed_demo_user
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    Base.metadata.create_all(bind=engine)
    # Seed demo user credentials
    db = SessionLocal()
    try:
        seed_demo_user(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="AWS Route 53 Clone Backend REST API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to AWS Route 53 Clone API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }


# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)
