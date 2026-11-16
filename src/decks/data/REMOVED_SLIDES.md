# Data deck: slides removed for now

These slides were taken out of the Data deck but may come back. Each removal is a
single git commit, so a slide can be restored exactly as it was (HTML, styles and
interactive code). Ask Claude to "restore <slide> from REMOVED_SLIDES.md", or
revert the commit by hand.

| Slide (data-id) | Title | Was slide # | Sat between | Removed in commit |
|---|---|---|---|---|
| `fields` | Where data fits: The big picture (clickable Venn: CS, data science, analytics, ML, AI) | 46 of 49 | Generate and compare → Careers | `7f74167` |
| `normstd` | Scaling features: Normalization vs. standardization | 34 of 48 | Transforming values → How to normalize | `e2bc5c6` |
| `howto` | The formulas: How to normalize (min-max worked example) | 35 of 48 | Normalization vs. standardization → When to scale | `e2bc5c6` |
| `whennorm` | When to scale: Does it matter? (k-NN raw vs. scaled) | 36 of 48 | How to normalize → Feature engineering | `e2bc5c6` |
| `spread` | How spread out? Range, variance, std. dev. (interactive) | 27 of 45 | Mean, median, mode → Data cleaning | `b06deda` |
| `statsum` | Cheat sheet: Descriptive statistics (table) | 28 of 45 | Range, variance, std. dev. → Data cleaning | `b06deda` |

## Notes for putting them back

- **Venn (`fields`)**: it drew AI as a small piece of machine learning, which
  conflicts with the AI History deck (AI ⊃ ML ⊃ DL). Fix the picture before
  restoring it.
- **Scaling slides**: put them back together, after "Transforming values". When they
  return, also add `"normalization"` back to the recap chips in `app.js`
  (`rcChips`). Slides 33 and 34 already mention scaling briefly.
- **Spread / cheat sheet**: put them back after "Mean, median, mode". Also add
  `"variance"` back to the recap chips.
- To see a removed slide's original code: `git show <commit>^:src/decks/data/shell.html`
  (and `app.js`).
