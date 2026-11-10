# AAI101 slides

Interactive web slides for AAI101. Students need no account. During class the instructor can lock the
slides so every student follows along and nobody can skip ahead.

- `index.html`: landing page listing the decks
- `<deck>/index.html`: one self-contained deck per folder
- `live.js` + `config.js` + `vendor/firebase.js`: live sync (Cloud Firestore)
- `firestore.rules`: who may read and write the sync state
- `src/`: the sources everything is built from

## One-time Firebase setup (project `neumont-slides`)

1. **Firestore**: Build → Firestore Database → Create database → Start in **production mode** → pick a
   location (e.g. `nam5`).
2. **Rules**: Firestore Database → Rules → paste `firestore.rules`, replace
   `YOUR_GOOGLE_EMAIL@example.com` with the Google account you present from, then **Publish**.
   (The email lives only in the Firebase console, so keep the placeholder in this repo.)
3. **Sign-in**: Authentication → Get started → Sign-in method → **Google** → Enable.
4. **Allowed sites**: Authentication → Settings → Authorized domains → **Add domain** →
   your GitHub Pages host, e.g. `neumont-gamedev.github.io`.

## Hosting (GitHub Pages)

Push this folder to a repo, then Settings → Pages → Deploy from branch → `main` / root.
The site is then at `https://<user>.github.io/<repo>/`.

## Teaching with it

- **Students** open the site normally. No sign-in.
- **You** open a deck with `?present` at the end of the URL, e.g. `…/ai-history-1/?present`, and click
  **Instructor sign-in**.
- Click **Class can roam** to switch to **Class follows you**. Students jump to your slide whenever you
  move, can scroll back to review, but can't go past you. Click again to free them.
- The lock state is remembered per deck, so late joiners land on your current slide.

If Firebase can't be reached (no internet, or opened as a local file), the slides still work. They just
aren't locked.

Free tier: Firestore's Spark plan allows 50,000 reads and 20,000 writes per day. Each slide change
costs one read per connected student, so a class of 30 uses roughly 1,000–2,000 reads per session.

## Editing and adding decks

Edit the sources in `src/`, then run:

```
python src/build.py
```

To add a deck, put its source in `src/decks/<slug>/`, add a builder function and a line to `DECKS`
in `src/build.py`, and rebuild. Each deck's `<slug>` is also its key in Firestore, so decks never
interfere with each other.

To update the bundled Firebase SDK: `cd src && npm install && npm run vendor`.
