# Device verification (UPI)

Emulators and Expo Go cannot do this. Use a **physical Android** with PhonePe and GPay (or Paytm / BHIM).

On this Mac, build the APK with **EAS** (cloud or local).

## Phone (do this first)

1. PhonePe + Google Pay installed and set up.
2. Same Wi‑Fi as the Mac.
3. Settings → allow **Install unknown apps** for Chrome / Files / Drive (wherever you will open the APK).
4. Keep the phone unlocked while you install.

## API on the Mac

```bash
cd server
bun run dev
```

Health: http://localhost:3000/api/v1/health  
The phone uses `http://192.168.29.236:3000` (change the IP in `client/eas.json` if your Wi‑Fi address changed).

## APK (cloud)

```bash
cd client
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

First run: create an Expo project if asked. When the build finishes, open the URL EAS prints, download the **APK**, send it to the phone (Drive, Telegram, USB), tap to install.

## APK (local, no cloud queue)

The local EAS build needs Java, Android SDK 36, build tools 36.0.0,
NDK 27.1.12297006, and CMake 3.22.1 installed with their SDK licenses accepted.
On this Mac the command-line SDK is in `/opt/homebrew/share/android-commandlinetools`
and Java is Homebrew OpenJDK 21. No Android Studio installation is needed.

```bash
cd client
bun run build:android:local
```

The script configures Java and SDK paths for the build without changing your
shell profile. Override `JAVA_HOME`, `ANDROID_HOME`, or `ANDROID_NDK_HOME` if
your tools are installed elsewhere. Local builds default to two Gradle workers;
set `PENDING_BUILD_WORKERS` to override that limit. EAS still uses your Expo login and signing
credentials. The APK is saved to `client/build/pending-preview.apk`; send it to
the Android phone and install it. Keep the API running and both devices on the
same Wi-Fi. The preview APK includes the JS bundle and does not need Metro.

## On the phone after install

1. Open **Pending** → allow camera.
2. Scan a merchant QR, or this string as a QR: `upi://pay?pa=shop@okaxis&pn=Cafe%20Noir&am=1&cu=INR`
3. Enter amount if missing (₹1–₹1,00,000). Use **₹1** if you will really pay.
4. Choose PhonePe → complete or cancel → return.
5. Return is **not** Paid unless the UPI app extra is SUCCESS. Empty result → “Confirm in your UPI app”.
6. Repeat with Google Pay.
7. Check Home month total (IST) and History.

Signed-in users also show up in `GET /api/v1/transactions`. iPhone is confirm-sheet only, not this checklist.
