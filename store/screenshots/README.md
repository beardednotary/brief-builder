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
- `out/iphone-large-1320x2868/`: optional, the large display slot

To redo some slides only: `render.ps1 -Slides "1,5"`. To change a headline,
edit `SLIDES` in `frame.html`; open `frame.html?n=1` in a browser to preview.

## iPad

`app.json` has `"supportsTablet": true`, which makes a 13-inch iPad set
(2064 x 2752) required too. If BriefBuilder should be iPhone-only, set it to
`false` before the release build and no iPad screenshots are needed.
