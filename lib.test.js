import test from "tape";

import { disallowUndefinedRead, pick, omit } from "./lib.js";

test("disallowUndefinedRead", (t) => {
  let obj = disallowUndefinedRead({ foo: 42 });
  t.ok(() => {
    obj.foo;
  });
  t.throws(() => {
    obj.bar;
  });
  t.end();
});

test("pick", t => {
  t.deepEquals(pick({ foo: 42, bar: 100 }, ["foo"]), { foo: 42 });
  t.deepEquals(pick({ foo: 42, bar: 100, baz: 999 }, ["foo", "baz"]), { foo: 42, baz: 999 });
  t.deepEquals(pick({ foo: 42, bar: 100 }, []), {});
  t.deepEquals(pick({}, ["foo"]), {});
  t.throws(() => pick({}, ["foo"], { throwWhenUnset: true }));
  t.end();
})

test("omit", t => {
  t.deepEquals(omit({ foo: 42, bar: 100 }, ["foo"]), { bar: 100 });
  t.deepEquals(omit({ foo: 42, bar: 100, baz: 999 }, ["foo", "baz"]), { bar: 100 });
  t.deepEquals(omit({ foo: 42, bar: 100 }, []), { foo: 42, bar: 100 });
  t.deepEquals(omit({}, ["foo"]), {});
  t.end();
})