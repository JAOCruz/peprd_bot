#!/bin/bash

# Remove node_modules and lock files
rm -rf node_modules
rm -f pnpm-lock.yaml
rm -f package-lock.json

# Install dependencies with npm
npm install

# Build the project
npm run build
