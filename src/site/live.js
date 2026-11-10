// live class sync for the web version of the slides (firebase backend)
// students: no account, they just follow the instructor's slide when the class is locked
// instructor: open a deck with ?present in the url, sign in with google, then use the lock button
import { initializeApp, getFirestore, doc, onSnapshot, setDoc, getDoc, getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "./vendor/firebase.js";
import { firebaseConfig } from "./config.js";

const Deck = window.Deck;
const deckId = document.querySelector('meta[name="deck-id"]')?.content;

if (Deck && deckId) {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const ref = doc(db, "decks", deckId);
  const slot = document.getElementById("liveauth");
  const wantsPresent = new URLSearchParams(location.search).has("present");

  // only slide + locked are ever stored; the security rules enforce the same shape
  const clean = (d) => ({ slide: Math.max(0, Math.floor(+d.slide) || 0), locked: d.locked === true });

  const studentAdapter = {
    role: "student",
    subscribe: (cb) => onSnapshot(ref, (s) => cb(s.exists() ? s.data() : null), (e) => console.warn("live sync stopped", e)),
  };
  const presenterAdapter = {
    role: "presenter",
    get: async () => { const s = await getDoc(ref); return s.exists() ? s.data() : null; },
    set: (w) => setDoc(ref, clean(w)),
  };

  function button(label, onClick) {
    slot.innerHTML = "";
    if (!label) return;
    const b = document.createElement("button");
    b.className = "lv";
    b.textContent = label;
    b.onclick = onClick;
    slot.appendChild(b);
  }

  async function becomePresenter() {
    try {
      // prove this account may write (the rules decide) without changing what students see
      const current = await presenterAdapter.get();
      await setDoc(ref, current ? clean(current) : { slide: Deck.current(), locked: false });
      await Deck.attachLive(presenterAdapter);
      button("Sign out", () => signOut(auth));
    } catch (e) {
      console.warn(e);
      Deck.toast("This account isn’t allowed to present.");
      await signOut(auth);
    }
  }

  onAuthStateChanged(auth, (user) => {
    if (user) { becomePresenter(); return; }
    Deck.attachLive(studentAdapter);
    if (wantsPresent) {
      button("Instructor sign-in", () =>
        signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => Deck.toast("Sign-in failed: " + (e.code || e.message))));
    } else button(null);
  });
}
