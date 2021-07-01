/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { cx } from '@emotion/css';

/**
 * We export `cx` from a single place so that we can access it without
 * having to disable the restricted import every time.
 *
 * We do NOT export `css` because we want to continue to disallow `css`
 * from being used, but `cx` is safe to use in any emotion context.
 */
export { cx };
