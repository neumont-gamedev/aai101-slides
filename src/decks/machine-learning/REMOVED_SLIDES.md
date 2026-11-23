# Machine Learning deck: slides removed for now

These slides were taken out of the Machine Learning deck but may come back. Each removal is a
single git commit, so a slide can be restored exactly as it was (HTML, styles and
interactive code). Ask Claude to "restore <slide> from REMOVED_SLIDES.md", or
revert the commit by hand.

| Slide (data-id) | Title | Was slide # | Sat between | Removed in commit |
|---|---|---|---|---|
| `slope` | From two points: Find the line (rise ÷ run worked example, score = 15 × hours + 35) | 14 of 47 | y = mx + b → How linear regression works | `bf7ed53` |
| `tree` | Classification: Decision trees (grow the tree one split at a time, route a student) | 21 of 47 | Finding the nearest neighbors (k-NN steps) → Unsupervised learning (term) | `0667207` |

## Notes for putting them back

- **`slope`**: y = mx + b now comes *before* "Draw the best line", so put this slide right after
  `ymxb` (before `linfit`). Its study-hours line (15x + 35) doesn't match the one in
  "How linear regression works" (ŷ = 5x + 50); make them the same if it comes back. Its key idea
  ("smallest total error ... line of best fit") repeats `linfit`.
- **`tree`**: hidden because it isn't being covered yet. The removal also dropped the
  "decision tree" recap chip; add it back between "k-NN" and "unsupervised". Decision trees are
  still *named* on the Traditional ML slide, the ML map and the models catalog (as an overview).
