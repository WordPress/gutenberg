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

/**
 * Private notice option naming a slot rendered after the notice's message,
 * for content that changes while the notice is shown. The message stays the
 * notice's text, which is what gets announced and copied.
 */
export const NOTICE_SLOT = Symbol( 'NOTICE_SLOT' );
