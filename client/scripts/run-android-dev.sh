#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
source scripts/android-env.sh

if ! adb devices | tail -n +2 | grep -q 'device$'; then
  printf '%s\n' 'No Android device found. Plug in the phone, turn on USB debugging, and accept the prompt on the phone.' >&2
  exit 1
fi

# Builds only for the connected phone's CPU, installs it, and starts Metro.
exec npx expo run:android "$@"
