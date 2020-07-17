# request-multiple-urls

A JavaScript package which fetches multiple URLs. Not intended for practical use, just a coding exercise.

Usage:
```js
let req = require("request-multiple-urls");
```

Options:
- `executionModel`:
  - `PARALLEL` - requests made in parallel; a success promise is returned once all complete successfully
  - `SEQUENCE` - requests made in sequence; a success promise is returned once all complete successfully

- requirements do not mention intended use environment (node, browser, Electron, etc) - library is implemented as NodeJS code, with Webpack to be used for conversion to other environments
- low-level library, so went for a lightweight testing framework (`tape`) over something heavier solutions, like `jest`
- only using stable features in current Node.js