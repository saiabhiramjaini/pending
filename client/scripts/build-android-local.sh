#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
source scripts/android-env.sh
mkdir -p build
exec npx eas-cli build --platform android --profile preview --local --output "$PWD/build/pending-preview.apk" "$@"
