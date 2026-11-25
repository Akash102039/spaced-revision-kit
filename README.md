# Spaced Revision Kit

A free, open-source, dependency-free spaced repetition scheduling library for students and educational app developers.

**Status:** Early-stage project. No public downloads, external contributors, or downstream adoption are claimed.

## Features

- Create flashcards tagged by topic
- Grade recall from 0 (forgot) to 5 (easy)
- Schedule next review using an SM-2-inspired algorithm
- Retrieve cards due by a date; track new and practiced cards
- Validate imported JSON decks including a 5,000-card limit and duplicate ID detection
- No analytics, tracking, network services or runtime dependencies
- Automated unit tests with Node.js 20+ and GitHub Actions

## Getting started

Install Node.js 20+, then run:

```sh
npm test
```

Use the library locally in another JavaScript module:

```js
import { createCard, reviewCard, dueCards } from './src/scheduler.mjs';

const card = createCard({
  id: 'q1',
  front: 'What is 2 + 2?',
  back: '4',
  topic: 'Mathematics'
});

const next = reviewCard(card, 4); // 0 = forgot, 5 = easy
console.log(next.dueAt);
console.log(dueCards([next]));
```

The review function does not mutate its inputs. All due dates are ISO 8601 UTC timestamps. Successful repetitions use 1 day, then 6 days, then gradually longer intervals using the card's ease factor; failed recall resets repetitions and records a lapse. This is an educational scheduling heuristic, not a prediction of exam outcomes.

## Browser demo

A browser-based flashcard demo is included in [index.html](index.html). It stores decks in your browser's local storage and supports adding cards, reviewing them, importing/exporting JSON backups and clearing local data. Run a local static server in the repository directory (for example `python3 -m http.server 8000`) and open `http://localhost:8000`. Opening the HTML file with `file://` may block ES module imports in some browsers. GitHub Pages deployment has not yet been enabled.

## Contributing

Real contributions are welcome: bug reports, test cases, accessibility improvements, translations, and focused code changes. Please open an issue describing the expected and observed behavior before large changes. For pull requests, include tests wherever possible. Do not commit secrets or student personal data.

## License

MIT © 2026 Akash102039. See [LICENSE](LICENSE).
