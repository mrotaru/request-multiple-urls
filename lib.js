import deepMerge from "deepmerge";

const disallowUndefinedRead = (obj) => {
  return new Proxy(deepMerge({}, obj), {
    get: function (target, name, receiver) {
      if (!(name in target)) {
        throw new Error(`No such property: ${name}`);
      }
      return Reflect.get(target, name, receiver);
    },
  });
};

const pick = (obj, properties = [], options = { throwWhenUnset: false }) => properties.reduce((acc, prop) => {
  if (obj.hasOwnProperty(prop)) {
    acc[prop] = obj[prop];
  } else {
    if (options.throwWhenUnset) {
      throw new Error(`No such property: ${prop}`);
    }
  }
  return acc;
}, {})

const omit = (obj, properties = []) => properties.reduce((acc, prop) => {
  delete acc[prop]
  return acc
}, deepMerge({}, obj))

const toArray = (maybeArray) =>
  Array.isArray(maybeArray) ? maybeArray : [maybeArray];

export {
  disallowUndefinedRead,
  pick,
  omit,
  toArray,
}