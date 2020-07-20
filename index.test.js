import nock from  "nock";
import { URL } from "url";
import test from "tape-promise/tape.js";

import requestMultipleUrls, { executionModels } from "./index.js";

const baseUrl = "https://example.com"
const urls = [
  `${baseUrl}/path/1.json`,
  `${baseUrl}/path/2.json`,
  `${baseUrl}/path/3.json`,
];

test("makes multiple requests using Promise.all (default)", async function (t) {
  intercept("/path/1.json", { delay: 100, payload: { id: 1 } });
  intercept("/path/2.json", { delay: 200, payload: { id: 2 } });
  intercept("/path/3.json", { delay: 300, payload: { id: 3 } });
  const res = await requestMultipleUrls(urls);
  t.deepEquals(res[0], { id: 1 });
  t.deepEquals(res[1], { id: 2 });
  t.deepEquals(res[2], { id: 3 });
});

test("makes multiple requests using Promise.race", async function (t) {
  intercept("/path/1.json", { delay: 300, payload: { id: 1 } });
  intercept("/path/2.json", { delay: 200, payload: { id: 2 } });
  intercept("/path/3.json", { delay: 100, payload: { id: 3 } });
  const res = await requestMultipleUrls(urls, { executionModel: executionModels.RACE });
  t.deepEquals(res, { id: 3 });
});

test("fails on error", async function (t) {
  intercept("/path/1.json", { delay: 100, payload: { id: 1 } });
  intercept("/path/2.json", { delay: 500, error: "error" });
  intercept("/path/3.json", { delay: 300, payload: { id: 3 } });
  await t.rejects(requestMultipleUrls(urls));
});

test("http code between < 200 or > 299 result in an a failed request", async function (t) {
  intercept("/path/1.json", { delay: 100, payload: { id: 1 } });
  intercept("/path/2.json", { delay: 200, payload: { id: 2 }, statusCode: 401 });
  intercept("/path/3.json", { delay: 300, payload: { id: 3 } });
  const res = await requestMultipleUrls(urls, { executionModel: executionModels.ALL_SETTLED });
  t.equals(res[1].status, "rejected");
  t.true(res[1].reason.message.includes("status code"));
})

test("fails when invalid JSON", async function (t) {
  intercept("/path/1.json", { delay: 100, payload: "not json" });
  const url = `${baseUrl}/path/1.json`;
  const res = await requestMultipleUrls(url, { executionModel: executionModels.ALL_SETTLED });
  t.equals(res[0].status, "rejected");
  t.true(res[0].reason.message.includes("valid JSON"));
})

test("picks the correct protocol (http vs https)", async function (t) {
  // https
  const url1 = "https://example.com/path/1.json"
  intercept(url1, { delay: 100, payload: { id: 1 } });
  intercept("/path/1.json", { delay: 100, payload: { id: 1 } });
  const res1 = await requestMultipleUrls([url1]);
  t.deepEquals(res1[0], { id: 1 });
  // http
  const url2 = "http://example.com/path/2.json"
  intercept(url2, { delay: 200, payload: { id: 2 } });
  const res2 = await requestMultipleUrls([url2]);
  t.deepEquals(res2[0], { id: 2 });
})

test.skip("real urls", async function (t) {
  const res = await requestMultipleUrls([
    'https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/ftse-fsi.json',
    'https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/gbp-hkd.json',
    'https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/gbp-usd.json',
    'https://ft-tech-test-example.s3-eu-west-1.amazonaws.com/no-such-thing',
  ], { executionModel: executionModels.ALL_SETTLED });
  console.log(res)
})

function intercept (path, options = {}) {
  const { delay, payload, error, statusCode = 200 } = options
  let finalPath = path;
  let base;
  try {
    const url = new URL(path);
    const { origin, pathname } = url;
    finalPath = pathname;
    base = origin;
  } catch (ex) {
    base = baseUrl;
  }
  if (payload) {
    if (delay) {
      nock(base).get(finalPath).delay(delay).reply(statusCode, payload)
    } else {
      nock(base).get(finalPath).reply(statusCode, payload)
    }
  } else if (error) {
    if (delay) {
      nock(base).get(finalPath).delay(delay).replyWithError(error)
    } else {
      nock(base).get(finalPath).replyWithError(error)
    }
  }
}
