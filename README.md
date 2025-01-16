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

- Multimodal search capabilities using both text and image inputs (To be discussed)
- Support for various digital collection types:
  - Historical maps
  - Photographs
  - Web archives
- Fine-tuned CLIP models for improved accuracy
- User-friendly web interface for exploration

## Installation

```bash
pip install -r requirements.txt
```

## References

Mahowald, J., & Lee, B. C. G. (2024). Integrating Visual and Textual Inputs for Searching Large-Scale Map Collections with CLIP. arXiv:2410.01190 [cs.IR]. https://arxiv.org/abs/2410.01190
