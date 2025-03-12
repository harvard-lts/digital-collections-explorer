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
- Fine-tuned CLIP models for improved accuracy (coming soon)
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

### Step 2: Run the Setup Script with Collection Type

```bash
npm install
npm run setup -- --type=photographs --name="My Photo Explorer"
```

Available collection types:
- `photographs`: For photo collections and image archives
- `maps`: For map collections (coming soon)
- `web-archives`: For web archive collections (coming soon)

This will configure the project for your specific collection type and build the frontend.

### Step 3: Set Up the Environment for the Backend

```bash
# Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 4: Prepare Your Collection

1. Add your images to the `data/raw` directory. Supported formats include JPG, JPEG, PNG, GIF, BMP, TIFF, and WebP. The images in subdirectories will also be retrieved recursively.

2. Generate embeddings for your collection:

```bash
python -m src.models.generate_embeddings
```

This will process all images in the `data/raw` directory and create embeddings in the `data/embeddings` directory.

### Step 5: Start the Backend Server

```bash
python -m src.backend.main
```

The API server will start at http://localhost:8000

### Customizing the Frontend

#### Development Mode

For active development with hot-reloading:

```bash
# First, make sure your the backend server is up
# If the server is not ready, cd into the root path and run:
python -m src.backend.main

# Start the frontend development server
cd src/frontend/[photographs|maps|web-archives]
npm run dev
```

This will start a development server at http://localhost:3000 with hot-reloading enabled. The development server will automatically proxy API requests to the backend at http://localhost:8000.

#### Production Build

When you're ready to deploy your changes, and only if you have customized the frontend and made code changes, since Step 2 has already built the frontend once:

```bash
npm run frontend-build
```

Then restart the backend server to serve the updated frontend.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## References

Mahowald, J., & Lee, B. C. G. (2024). Integrating Visual and Textual Inputs for Searching Large-Scale Map Collections with CLIP. arXiv:2410.01190 [cs.IR]. https://arxiv.org/abs/2410.01190
