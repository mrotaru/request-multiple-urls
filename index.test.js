import nock from  "nock";
import test from "tape-promise/tape.js";

import request, { executionModels } from "./index.js";

test("https request", function (t) {
  // TODO mock
  const urls = [
    "https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/ftse-fsi.json",
    "https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/gbp-hkd.json",
    "https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/gbp-usd.json",
  ];
});
