#!/usr/bin/env bash
set -euo pipefail

# Homebrew defaults can be overridden for another local Android toolchain.
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export ANDROID_NDK_HOME="${ANDROID_NDK_HOME:-$ANDROID_HOME/ndk/27.1.12297006}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
# Keep subsequent local builds manageable on an 8 GB Mac.
export GRADLE_OPTS="${GRADLE_OPTS:-} -Dorg.gradle.workers.max=${PENDING_BUILD_WORKERS:-2} -Dorg.gradle.parallel=false"

if [[ ! -x "$JAVA_HOME/bin/java" || ! -f "$ANDROID_HOME/platforms/android-36/android.jar" || ! -d "$ANDROID_NDK_HOME" ]]; then
  printf '%s\n' 'Install Java, Android SDK 36, build tools 36.0.0, NDK 27.1.12297006 and CMake 3.22.1 before building.' >&2
  exit 1
fi

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
mkdir -p build
exec npx eas-cli build --platform android --profile preview --local --output "$PWD/build/pending-preview.apk" "$@"
