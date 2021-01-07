/* eslint-disable jsdoc/valid-types */
/**
 * Checks whether a value is defined, asserting that it is neither
 * null nor undefined.
 *
 * @template T
 * @param {T | undefined | null} value The value to check.
 * @return {value is T} Whether the value is undefined.
 */
const isDefined = ( value ) => value !== null && value !== undefined;

export default isDefined;
/* eslint-enable jsdoc/valid-types */
