# === Stage 1: Frontend build ===
FROM node:20-slim AS node-builder

WORKDIR /app
COPY . /app

ARG COLLECTION_TYPE=photographs
RUN npm install --omit=dev && \
    npm run setup -- --type=$COLLECTION_TYPE && \
    mkdir -p /build/dist && \
    cp -r src/frontend/$COLLECTION_TYPE/dist/* /build/dist/

# === Stage 2: Python runtime setup ===
FROM python:3.12-slim

WORKDIR /app
COPY . /app

COPY --from=node-builder /build/dist /tmp/dist
COPY --from=node-builder /app/config.json /app/config.json

ARG COLLECTION_TYPE=photographs
RUN mkdir -p /app/src/frontend/$COLLECTION_TYPE/dist && \
    mv /tmp/dist/* /app/src/frontend/$COLLECTION_TYPE/dist/

RUN pip install --no-cache-dir -r requirements.txt \
    && rm -rf ~/.cache/pip

ARG SKIP_GEN_EMBEDDING=false
ENV SKIP_GEN_EMBEDDING=$SKIP_GEN_EMBEDDING

EXPOSE 8000

CMD [ "sh", "-c", "if [ \"$SKIP_GEN_EMBEDDING\" = \"false\" ]; then python -m src.models.clip.generate_embeddings; fi && python -m src.backend.main" ]