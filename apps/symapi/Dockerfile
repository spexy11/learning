FROM ghcr.io/astral-sh/uv:alpine3.22
EXPOSE 8000

WORKDIR /app

COPY pyproject.toml uv.lock* ./
RUN uv sync

COPY . .
CMD ["uv", "run", "fastapi", "dev", "main.py", "--host", "0.0.0.0"]
