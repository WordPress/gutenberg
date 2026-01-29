/**
 * Internal dependencies
 */
import type { Notice } from './types';

/**
 * Default context to use for notice grouping when not otherwise specified. Its
 * specific value doesn't hold much meaning, but it must be reasonably unique
 * and, more importantly, referenced consistently in the store implementation.
 */
export const DEFAULT_CONTEXT = 'global';

/**
 * Default notice status.
 */
export const DEFAULT_STATUS: Notice[ 'status' ] = 'info';
