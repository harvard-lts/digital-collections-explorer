# Digital Collections Explorer

A web-based exploratory search system leveraging CLIP (Contrastive Language-Image Pre-training) models for enhanced discovery of digital collections, including maps, photographs, and web archives.

## Overview

This project builds upon the research presented in [Integrating Visual and Textual Inputs for Searching Large-Scale Map Collections with CLIP](https://arxiv.org/abs/2410.01190) by Mahowald and Lee. Their work demonstrates the potential for interactively searching large-scale map collections using:
- Natural language inputs (e.g., "maps with sea monsters")
- Visual inputs (reverse image search)
- Multimodal inputs (e.g., an example map + "more grayscale")

Our project extends their work in two main directions:

1. Development of a user-friendly, public-facing web interface for exploratory search
2. Implementation of advanced fine-tuning techniques for CLIP models specialized in handling digitized and born-digital collections

## Features

- Multimodal search capabilities using both text and image inputs
- Support for various digital collection types:
  - Historical maps
  - Photographs
  - Web archives
- Fine-tuned CLIP models for improved accuracy
- User-friendly web interface for exploration

## Quick Start Guide

### Prerequisites

- Python 3.8+ 
- Node.js 14+ (for frontend)
- Git
- Docker (optional, for containerized deployment)

### Step 1: Clone the Repository

```bash
git clone https://github.com/hinxcode/digital-collections-explorer.git
cd digital-collections-explorer
```

### Step 2: Set Up the Environment

```bash
# Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the setup script to create necessary directories
chmod +x setup.sh
./setup.sh
```

### Step 3: Prepare Your Collection

1. Create a folder for your collection in the `data/raw` directory:

```bash
mkdir -p data/raw/my_collection
```

2. Add your images to this folder. Supported formats include JPG, PNG, GIF, BMP, TIFF, and WebP.

3. Generate embeddings for your collection:

```bash
python -m src.models.generate_embeddings --collection my_collection
```

This will process all images in your collection and create embeddings in the `data/embeddings` directory.

### Step 4: Start the Backend Server

```bash
python -m src.backend.main
```

The API server will start at http://localhost:8000

### Step 5: Set Up and Start the Frontend

```bash
cd src/frontend
npm install
npm start
```

The frontend will be available at http://localhost:3000

### Step 6: Use Your Collection Explorer

1. Open your browser and navigate to http://localhost:3000
2. Use the interface to search your collections:
   - Text Search: Enter natural language queries like "sunset over mountains"
   - Image Search: Upload an image to find similar items
   - Combined Search: Use both text and image inputs for more precise results
3. Filter results by collection using the collection selector

## Docker Deployment (Alternative)

For a containerized deployment, you can use Docker Compose:

```bash
# Build and start the containers
docker-compose up -d

# Generate embeddings for your collection
docker-compose exec backend python -m src.models.generate_embeddings --collection my_collection
```

## Advanced Usage

### Adding Multiple Collections

You can add multiple collections to your explorer:

1. Create separate folders for each collection in `data/raw`
2. Generate embeddings for each collection:

```bash
python -m src.models.generate_embeddings --collection collection1
python -m src.models.generate_embeddings --collection collection2
```

### Fine-tuning CLIP for Your Collections

To improve search results for your specific domain:

1. Prepare a dataset of image-caption pairs in `data/fine_tuning`
2. Run the fine-tuning script:

```bash
python -m src.models.fine_tuning.train --dataset my_dataset --epochs 10
```

This will create a fine-tuned model that better understands your specific collection types.

### Customizing the Frontend

The frontend is built with React and can be customized:

1. Edit components in `src/frontend/src/components`
2. Modify styles in `src/frontend/src/App.css`
3. Rebuild the frontend:

```bash
cd src/frontend
npm run build
```

## Project Structure

```bash
.
├── config.json
