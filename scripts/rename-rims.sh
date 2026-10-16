#!/usr/bin/env bash
# Run from repo root: bash scripts/rename-rims.sh
# Moves rim images into category subfolders and removes the old messy filenames.

set -e
cd "$(dirname "$0")/.." || exit 1

mkdir -p public/images/wheels/rims/{high-end,lowrider,muscle,offroad,sport,suv,tuner,bike,bennys-originals,bennys-bespoke,race,street,track}

echo "Run the full rename by copying the mapping from src/data/rim-rename-mapping.json"
echo "Or execute the moves listed in that file."
echo "Example:"
echo "  mv public/images/wheels/rims/Blade-High-End-wheels-gtav.webp public/images/wheels/rims/high-end/blade.webp"
