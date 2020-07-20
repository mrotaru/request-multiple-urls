import https from "https";
import http from "http";
import { URL } from "url";
import deepMerge from "deepmerge";

import { omit, disallowUndefinedRead, toArray } from "./lib.js";

const executionModels = disallowUndefinedRead({
  ALL_SUCCEEDED: Symbol(),
  ANY_SUCCEEDED: Symbol(),
  ALL_SETTLED: Symbol(),
  RACE: Symbol(),
});

const promiseMethods = disallowUndefinedRead({
  [executionModels.ALL_SUCCEEDED]: "all",
  [executionModels.ANY_SUCCEEDED]: "any",
  [executionModels.ALL_SETTLED]: "allSettled",
  [executionModels.RACE]: "race",
});

async function requestMultipleUrls(
  urls,
  options = { executionModel: executionModels.ALL_SUCCEEDED },
) {
  const _urls = toArray(urls).map((url) => new URL(url));
  const requesterOptions = omit(options, ["executionModel"]);
  const promises = _urls.map((url) => requestSingleUrl(url, requesterOptions));
  return Promise[promiseMethods[options.executionModel]](promises);
}

async function requestSingleUrl(url, options) {
  return new Promise((resolve, reject) => {
    const { hostname, pathname, protocol, href } = url;
    let tempExecutorConfig = {
      protocol,
      hostname,
      path: pathname,
      headers: {
        "Accept": "application/json",
      },
    };

    // select executor (http or https)
    let executor;
    if (protocol === "http:") {
      executor = http;
    } else if (protocol === "https:") {
      executor = https;
      tempExecutorConfig.port = 443;
    } else {
      throw new Error(`Unknown protocol: ${protocol}`);
    }

    // build executor config object and execute request
    const finalExecutorConfig = deepMerge(tempExecutorConfig, options);
    const req = executor.request(finalExecutorConfig, (res) => {
      const { statusCode, statusMessage } = res;
      // HTTP status codes between 200 and 299 are OK; others will result in
      // a rejected promise. Based on the "ok" flag of the Fetch API
      // https://fetch.spec.whatwg.org/#statuses
      if (statusCode < 200 || statusCode > 299) {
        reject({ message: `Request for ${href} not OK: HTTP status code: ${statusCode}, status message: "${statusMessage}"` })
      } else {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (ex) {
            reject({ message: `Response for ${href} is not valid JSON: "${data}"`})
          }
        });
      }
    });
    req.on("error", (error) => {
      reject(error);
    });
    req.end();
  });
}

export { executionModels };

export default requestMultipleUrls;
