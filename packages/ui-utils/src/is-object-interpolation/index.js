/* global TemplateStringsArray */
/**
 * External dependencies
 */
import isPlainObject from 'lodash/isPlainObject';

/* eslint-disable jsdoc/valid-types */
/**
 *
 * There's no way to detect whether an `any` type is an `ObjectInterpolation` because `ObjectInterpolation`s
 * are merely objects where the keys are either (1) [CSS property names](https://github.com/emotion-js/emotion/blob/a72e6dc0f326b7d3d6067698d433018ee8c4cbf1/packages/serialize/types/index.d.ts#L10),
 * (2) [CSS Pseudo property names](https://github.com/emotion-js/emotion/blob/a72e6dc0f326b7d3d6067698d433018ee8c4cbf1/packages/serialize/types/index.d.ts#L18),
 * or (3) [anything else where the value for the key is another interpolation](https://github.com/emotion-js/emotion/blob/a72e6dc0f326b7d3d6067698d433018ee8c4cbf1/packages/serialize/types/index.d.ts#L19).
 * That means ObjectInterpolations can look all of the following ways:
 *
 * ```js
 * const oi = {
 *   color: 'black',
 * };
 *
 * const oi = {
 *   ':disabled': css`color: black;`,
 * };
 *
 * const oi = {
 *   '@media (prefers-color-scheme: light)': css({
 *     backgroundColor: 'black',
 *     color: 'white',
 *   }),
 * };
 * ```
 *
 * Therefore, this function only accepts `TemplateStringsArray` and `Interpolation` for it's arguments rather than `any`, which
 * cannot be refined to an `ObjectInterpolation`. However, given any generic `Interpolation`, we _can_ tell whether it is an
 * `ObjectInterpolation` specifically by simply checking whether the value is "plain object" as defined by `lodash`'s `isPlainObject`.
 *
 * Note: The links above reference a specific commit for **Emotion 10**. Emotion 11 is out but we're stuck on Emotion 10 until we can
 * re-write `create-styles` and upgrade all of `@wordpress/components` to use the new version of Emotion.
 *
 * At that point we'll have to revisit this function anyway as it seems that the `ObjectInterpolation` type no longer
 * exists and that the concept has evolved.
 *
 * @param {TemplateStringsArray | import('create-emotion').Interpolation} value The value to check.
 * @return {value is import('create-emotion').ObjectInterpolation} Whether the value is an ObjectInterpolation.
 */
const isObjectInterpolation = ( value ) => isPlainObject( value );
/* eslint-enable jsdoc/valid-types */

export default isObjectInterpolation;
