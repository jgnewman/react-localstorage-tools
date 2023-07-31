/**
 * Safely attempts to parse any value. This is important because we are running
 * JSON.stringify on every value we put into localStorage. This means we could end up
 * with strings that look like this for exampe: '"foo"'
 *
 * This function can take the following values and return them all correctly:
 * '"foo"' -> "foo"
 * "foo" -> "foo"
 * { bar: "foo" } -> { bar: "foo" }
 * '{ "bar": "foo" }' -> { bar: "foo" }
 * ["foo"] -> ["foo"]
 * '["foo"]' -> ["foo"]
 * etc...
 *
 * Also works as expected with numbers and other values like null or undefined.
 * "4" -> 4
 * 4 -> 4
 * etc...
 */
const safeParse = <T>(value: any): T => {
  try {
    const json = `{ "value": ${value} }`
    return JSON.parse(json).value as T
  } catch (_) {
    return value as T
  }
}

export default safeParse
