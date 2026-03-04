#!/usr/bin/env bash

set -euo pipefail

echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

echo "🔨 Building web assets with Vite..."
npm run build

echo "🔄 Syncing Capacitor..."
npx cap sync android

echo "✅ Pre-install complete!"
