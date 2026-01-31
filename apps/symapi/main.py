from fastapi import FastAPI
from expr import router as expr_router

app = FastAPI()

app.include_router(expr_router)
