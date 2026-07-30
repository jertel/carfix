#!/bin/bash

# Parse command line arguments
BUILD_ENV=${1:-local}
if [[ $1 && $1 != --* ]]; then
    shift
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    --device)
      DEVICE="$2"
      shift 2
      ;;
    --no-build)
      BUILD_NPM=false
      shift
      ;;
    --no-test)
      RUN_TESTS=false
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

RUN_SIMULATOR=${RUN_SIMULATOR:-true}
DEVICE=${DEVICE:-Pixel_9}
DEVICE_ID=${DEVICE_ID:-emulator-5554}
BUILD_NPM=${BUILD_NPM:-true}
RUN_TESTS=${RUN_TESTS:-true}
ANDROID_HOME=~/Android/Sdk
QT_QPA_PLATFORM=xcb
CAPACITOR_ANDROID_STUDIO_PATH=/usr/bin/android-studio
JAVA_HOME=/opt/android-studio/jbr
GRADLE_LOCAL_JAVA_HOME=$JAVA_HOME
PATH=$JAVA_HOME/bin:$ANDROID_HOME/..:$PATH

set -e

npm i
node ./copy_icons.js

if [[ "$BUILD_NPM" == "true" ]]; then
    if [[ "$BUILD_ENV" == "prod" ]]; then
        VITE_BUILD_ARGS=--minify=true NODE_ENV=production npm run build
        export NODE_ENV=production
    elif [[ "$BUILD_ENV" == "dev" ]]; then
        VITE_BUILD_ARGS=--minify=false NODE_ENV=development npm run build
    else
        VITE_BUILD_ARGS=--minify=false NODE_ENV=localhost npm run build
    fi
fi
npx cap sync android

if [[ "$RUN_SIMULATOR" == "true" ]]; then
  if ! ps -ef | grep $DEVICE | grep Android > /dev/null; then
      $ANDROID_HOME/emulator/emulator -avd $DEVICE &
  fi
fi

# Build the android app
cd android
if [[ "$BUILD_ENV" == "prod" ]]; then
    # Load signing secrets if available
    SECRETS_FILE=~/projects/carfix-secrets/signing.env
    if [ -f "$SECRETS_FILE" ]; then
        source "$SECRETS_FILE"
    fi

    # Build the production bundle (.aab) and release APK signed with production key
    KEYSTORE_FILE=~/projects/carfix-secrets/carfix.jks
    GRADLE_PROD_TASKS="bundleRelease assembleRelease"
    if [[ "$RUN_TESTS" == "true" ]]; then
        GRADLE_PROD_TASKS="testReleaseUnitTest $GRADLE_PROD_TASKS"
    fi

    ./gradlew $GRADLE_PROD_TASKS \
        -PRELEASE_STORE_FILE="$KEYSTORE_FILE" \
        -PRELEASE_STORE_PASSWORD="$RELEASE_STORE_PASSWORD" \
        -PRELEASE_KEY_ALIAS="$RELEASE_KEY_ALIAS" \
        -PRELEASE_KEY_PASSWORD="$RELEASE_KEY_PASSWORD"

    echo "Production .aab bundle created at: app/build/outputs/bundle/release/app-release.aab"
    echo "Production APK created at: app/build/outputs/apk/release/app-release.apk"
    echo "Java/Kotlin mapping file created at: app/build/outputs/mapping/release/mapping.txt"
    echo "Native debug symbols created at: app/build/outputs/native-debug-symbols/release/native-debug-symbols.zip"

    if [[ "$RUN_SIMULATOR" == "true" ]]; then
      # Install the signed release APK to the device
      $ANDROID_HOME/platform-tools/adb -s $DEVICE_ID install app/build/outputs/apk/release/app-release.apk
    fi
else
    GRADLE_DEV_TASKS="assembleDebug"
    if [[ "$RUN_TESTS" == "true" ]]; then
        GRADLE_DEV_TASKS="testDebugUnitTest $GRADLE_DEV_TASKS"
    fi
    ./gradlew $GRADLE_DEV_TASKS

    if [[ "$RUN_SIMULATOR" == "true" ]]; then
      # Install the app to the device
      $ANDROID_HOME/platform-tools/adb -s $DEVICE_ID install app/build/outputs/apk/debug/app-debug.apk
    fi
fi

if [[ "$RUN_SIMULATOR" == "true" ]]; then
  # Run the app on the device
  $ANDROID_HOME/platform-tools/adb -s $DEVICE_ID shell am start -n "com.carfix/com.carfix.MainActivity"
fi
