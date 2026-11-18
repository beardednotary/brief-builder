# App Store screenshots

Six framed screenshots: a headline on the app's navy and gold, with a real
capture from the app inside a device frame. Wording and order match
[../listing.md](../listing.md).

| # | Capture this screen | Headline |
|---|---|---|
| 1 | Statement Writer showing two options with character counts | AI writes your EPB statements |
| 2 | New log entry, partly filled in | Log it in 30 seconds |
| 3 | Builder tab with a full block open (263/350) | All four blocks, 350 characters each |
| 4 | Dashboard | Know where your EPB stands |
| 5 | Statement Writer right after saving an option | Action and impact, no fluff |
| 6 | Profile tab with the referral card in view | Give a friend a free month |

## 1. Load the demo data

Run the development build against `npx expo start`. On the Profile tab,
scroll to the bottom and tap **Load Screenshot Demo Data (dev only)**. It
replaces this device's profile, log and EPB blocks with a realistic set (a
SrA in Cyber Transport, 5 of 8 statements written) and reloads the app.

If the Expo dev tools button floats over the app, hide it from the dev menu
(shake the phone) before capturing.

## 2. Capture, in this order

The order matters: step 5 saves a statement, which changes the dashboard and
builder.

1. **raw/4.png**: the Dashboard tab as it opens.
2. **raw/3.png**: the Builder tab, with Executing the Mission open.
3. **raw/1.png**: on the Dashboard, tap **✨ Write** on "Built a SharePoint
   tracker…". The Statement Writer opens with two options already written.
4. **raw/5.png**: tap Option 1. Capture the success card ("Improving the
   Unit: 1 of 2 statements done", "Write the next one").
5. **raw/2.png**: tap **+ Log** and start an entry, for example: *Set up
   comms for the base change of command. 600 guests, zero outages.* Pick
   Executing the Mission. Capture before saving.
6. **raw/6.png**: the Profile tab, scrolled so the referral card is in view.

Any iPhone with Face ID works; the frame scales the capture. Use the side
button + volume up, then AirDrop or copy the PNGs into `raw/` with the names
above.

## 3. Render

```powershell
powershell -ExecutionPolicy Bypass -File store\screenshots\render.ps1
```

Output lands in `out/` (git-ignored):

- `out/iphone-medium-1206x2622/`: **required**, the "iPhone with Dynamic
  Island, medium display" slot in App Store Connect
- `out/ipad-13-2064x2752/`: **required** while the app supports iPad, the
  13-inch iPad slot
- `out/iphone-large-1320x2868/`: optional, the large display slot

To redo some slides or devices only: `render.ps1 -Slides "1,5" -Devices "ipad"`.
To change a headline, edit `SLIDES` in `frame.html`; open `frame.html?n=1`
(or `?n=1&d=ipad`) in a browser to preview.

## iPad

BriefBuilder supports iPad (`"supportsTablet": true` in `app.json`), so the
13-inch set is required. Apple wants iPad screenshots of the app running on
an iPad, not phone captures in an iPad frame. The iPad simulator counts.

### On a Mac, with the simulator (easiest)

No provisioning needed, and the simulator saves screenshots at exactly
2064 x 2752.

1. Pull the `revenuecat-referrals` branch and run `npm install`.
2. Build and install the simulator client:
   `eas build --profile development-simulator --platform ios`, then
   `eas build:run --platform ios --profile development-simulator --latest`
   and pick a 13-inch iPad Pro simulator.
3. Run `npx expo start` and open the project in the simulator.
4. Finish onboarding, close the paywall, then load the demo data from the
   Profile tab (step 1 above).
5. Capture the same six screens in **portrait**, in the same order, with
   ⌘S (each lands on the Desktop as a PNG). The simulator is not Pro, so the
   dashboard shows a small free-writes card and the referral card shows the
   "Give a month, get a month" version; both are fine.
6. Copy them to this Windows machine as `raw-ipad/1.png` to `raw-ipad/6.png`
   and render with `render.ps1 -Devices "ipad"` (the renderer needs Windows:
   it uses Edge and System.Drawing).

### On a physical iPad

1. Register the iPad for development builds: `eas device:create`, then open
   the link it prints on the iPad.
2. Rebuild the development client so it includes the iPad:
   `eas build --profile development --platform ios`, run in your own
   terminal. When EAS offers to choose the devices for the provisioning
   profile, say yes and tick the iPad; a build that reuses the old profile
   fails on the iPad with "integrity could not be verified". Then install it.
   On iPadOS 16 and later, turn on Settings → Privacy & Security →
   Developer Mode before opening it.
3. On the iPad, run against `npx expo start`, load the demo data (step 1
   above; the iPad has its own data), and capture the same six screens in
   **portrait**, in the same order, into `raw-ipad/1.png` to `raw-ipad/6.png`.

On iPad the app rotates and can run in resized windows: Expo declares all
four orientations for iPad, as Apple now requires, so only the iPhone stays
locked to portrait. While capturing, turn the iPad to landscape on each
screen once to check nothing breaks; App Review tests iPad.
