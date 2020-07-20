# request-multiple-urls [![Build Status](https://travis-ci.org/mrotaru/request-multiple-urls.svg?branch=master)](https://travis-ci.org/mrotaru/request-multiple-urls)

Note: this is a coding exercise and not intended for practical use.

This package exports a single function, `requestMultipleUrls`, which takes as the first parameter a list of URLs to JSON files. By default, the function will make the requests in parallel, using [`Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).

Example:
```js
import requestMultipleUrls from "request-multiple-urls"
const res = await requestMultipleUrls([
  'https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/ftse-fsi.json',
  'https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/gbp-hkd.json',
]);
```
### The `executionModel` Option

The second, optional parameter is an object with configuration options. One such option is `executionModel`; it's value must be one of the properties of the `executionModels` object, which is exported by the module in addition to the `requestMultipleUrls` function. The `executionModel` property can be used for selecting any of the `Promise` methods - such as `Promise.race`:

```js
import requestMultipleUrls, { executionModels } from "./index.js";
const res = await requestMultipleUrls([
  'https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/ftse-fsi.json',
  'https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/gbp-hkd.json',
], { executionModel: executionModels.RACE });
```

An URL is considered to be fetched successfully if **all** the conditions below are satisfied:
- the URL is a valid [WHATWG URL](https://url.spec.whatwg.org/#urls), using the http or https protocol
- a GET request could be made successfully and resulted in a response (did not time out)
- the HTTP response code is between 200 and 299 (inclusive) - this is the same logic employed by the `ok` flag used by the `fetch` API
- the response body contains valid JSON

#### `executionModels.ALL_SUCCEEDED`
Fulfills once all URLs are fetched successfully, with an array containing the fulfil values - objects resulting from parsing the JSON payloads. Rejects as soon as any of the URLs fails to be fetched successfully, with the rejection reason as the value.

#### `executionModels.ANY_SUCCEEDED`
Fulfills as soon as at least one URL is fetched successfully; the fetched payload will be parsed into an object and used as the fulfil value. Rejects if _none_ of the URLs can be fetched successfully; the reject value is an instance of [`AggregateError`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError), which has an `errors` property - an array containing the rejection reasons for each URL.
 
#### `executionModels.ALL_SETTLED` 
Fulfills once for each URL, a responses has been received or the request timed out. The fulfil value will be an array of objects; each objects corresponds to an URL. If the URL was fetched successfully, it's corresponding object will have a "status" property with the "fulfilled" value, and a "value" property holding the object parsed from the payload.

For URL that were not fetched successfully, the corresponding objects will have a "status" property with "rejected" as the value, and a "reason" property with an `Error` instance as the value.

#### `executionModels.RACE`

Fulfills if the first received HTTP response results in the URL being fetched successfully, with the parsed value as the fulfil value. Rejects if the first received response does not result in a successful fetch, or as soon as it turns out a request cannot even be made (i.e., because the URL is not valid), or if a request times out before any responses are received.

## Other Options

All properties of the configuration object, except `executionModel`, will be passed to the `request()` method of `http/https`; for documentation on available options, see: https://nodejs.org/api/http.html#http_http_request_options_callback. For example, this option can be used to send additional headers:

```js
import requestMultipleUrls, { executionModels } from "./index.js";
const res = await requestMultipleUrls([
  'https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/ftse-fsi.json',
  'https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/gbp-hkd.json',
], {
  headers: {
    "api-key": "2346ad27d7568ba9896f1b7da6b5991251debdf2",
  }
}
```

## Notes
- the package is an ECMAScript Node.js module; this enables using of `import` syntax without the `--experimental-modules` flag, but requires Node.js >= 13
- only JavaScript features supported by current Node.js are used, so no transpilers are required
- low-level library, so went for a lightweight testing framework (`tape`) over something heavier solutions, like `jest` or `mocha`
- the `nock` library is used for intercepting HTTP requests for testing purposes