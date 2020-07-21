/*
 * Stylis is the CSS compiler used by many CSS-in-JS solutions, including
 * Emotion, Styled Components, Linaria, and more.
 *
 * The latest Emotion (v10) currently uses an enhanced version of Stylis v3.x.
 *
 * As of April 23, 2020, Stylis has had a major upgrade to v4.x.
 * The middleware (plugin) APIs may need to be adjusted if Emotion
 * updates their internal CSS compiler to Stylis v4.
 *
 * For more information:
 * https://github.com/thysultan/stylis.js
 * https://github.com/emotion-js/emotion/tree/master/packages/stylis
 */

export { default as stylisPluginCssCustomProperties } from './custom-css-properties';
