FROM python:3.12-slim

RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /app
COPY . /app

ARG COLLECTION_TYPE=photographs
ARG SKIP_GEN_EMBEDDING=false
ENV SKIP_GEN_EMBEDDING=$SKIP_GEN_EMBEDDING

RUN npm install && npm run setup -- --type=$COLLECTION_TYPE
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD [ "sh", "-c", "if [ \"$SKIP_GEN_EMBEDDING\" = \"false\" ]; then python -m src.models.clip.generate_embeddings; fi && python -m src.backend.main" ]