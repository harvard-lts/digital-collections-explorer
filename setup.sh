#!/bin/bash

# Create project directory structure
mkdir -p src/frontend/public src/frontend/src src/backend/api src/backend/utils src/models/clip src/models/fine_tuning data/raw data/processed data/embeddings docs/tutorials tests/backend tests/models

# Create necessary files
touch data/raw/.gitkeep data/processed/.gitkeep data/embeddings/.gitkeep

# Create configuration files
echo '{
  "data_dir": "data",
  "raw_data_dir": "data/raw",
  "processed_data_dir": "data/processed",
  "embeddings_dir": "data/embeddings",
  "model_config": {
    "clip_model": "ViT-B/32",
    "batch_size": 32,
    "device": "cuda" 
  },
  "api_config": {
    "host": "0.0.0.0",
    "port": 8000,
    "debug": true
  },
  "frontend_config": {
    "port": 3000
  }
}' > config.json

# Create Docker files
echo 'FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "-m", "src.backend.main"]' > Dockerfile

echo 'version: "3.8"

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./src:/app/src
    environment:
      - PYTHONPATH=/app
    command: uvicorn src.backend.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./src/frontend:/app
    ports:
      - "3000:3000"
    command: sh -c "npm install && npm start"
' > docker-compose.yml

echo "Project structure created successfully!" 