# Device verification (UPI)

Emulators and Expo Go cannot do this. Use a **physical Android** with PhonePe and GPay (or Paytm / BHIM).

On this Mac, build the APK with **EAS** (not Android Studio).

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

## On the phone after install

1. Open **Pending** → allow camera.
2. Scan a merchant QR, or this string as a QR: `upi://pay?pa=shop@okaxis&pn=Cafe%20Noir&am=1&cu=INR`
3. Enter amount if missing (₹1–₹1,00,000). Use **₹1** if you will really pay.
4. Choose PhonePe → complete or cancel → return.
5. Return is **not** Paid unless the UPI app extra is SUCCESS. Empty result → “Confirm in your UPI app”.
6. Repeat with Google Pay.
7. Check Home month total (IST) and History.

Signed-in users also show up in `GET /api/v1/transactions`. iPhone is confirm-sheet only, not this checklist.
