import https from "https";
import http from "http";
import { URL } from "url";
import deepMerge from "deepmerge";

const toArray = (maybeArray) =>
  Array.isArray(maybeArray) ? maybeArray : [maybeArray];

const executionModels = {
  ALL_SUCCEEDED: Symbol(),
  ANY_SUCCEEDED: Symbol(),
  ALL_SETTLED: Symbol(),
  RACE: Symbol(),
};

const promiseMethods = {
  [executionModels.ALL_SUCCEEDED]: "all",
  [executionModels.ANY_SUCCEEDED]: "any",
  [executionModels.ALL_SETTLED]: "allSettled",
  [executionModels.RACE]: "race",
};

async function requestSingleUrl(url, options) {
  return new Promise((resolve, reject) => {
    const { hostname, pathname, protocol } = url;
    let tempExecutorConfig = {
      protocol,
      hostname,
      path: pathname,
      headers: {
        "Content-Type": "application/json",
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
      console.log(`statusCode: ${res.statusCode}`);
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve(JSON.parse(data));
      });
    });
    req.on("error", (error) => {
      reject(error);
    });
    req.end();
  });
}

async function request(
  urls,
  options = { executionModel: executionModels.ALL_SUCCEEDED },
  requester = requestSingleUrl
) {
  const _urls = toArray(urls).map((url) => new URL(url));
  const promiseMethod = Promise[promiseMethods[options.executionModel]];
  promiseMethod(_urls.map((url) => requester(url, finalOptions)));
}

export { executionModels };

export default request;
