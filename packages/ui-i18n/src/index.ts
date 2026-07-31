/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { AnyMessage } from './types';

/**
 * The message catalog for `@wordpress/ui`.
 *
 * Every entry is a function so that its gettext call runs only when that
 * message is needed, rather than resolving the whole catalog when the module
 * loads. Going through a function also leaves room to resolve messages through
 * something other than the global `__` later.
 */
const messages = {
	CANCEL: () => __( 'Cancel' ),

	CLEAR: () => __( 'Clear' ),

	CLEAR_ALL: () => __( 'Clear all' ),

	CLOSE: () => __( 'Close' ),

	DISMISS: () => __( 'Dismiss' ),

	LOADING: () => __( 'Loading' ),

	MORE_DETAILS_FOLLOW: () => __( 'More details follow.' ),

	MORE_DETAILS_FOLLOW_THE_FIELD: () => __( 'More details follow the field.' ),

	NO_RESULTS_FOUND: () => __( 'No results found.' ),

	OK: () => __( 'OK' ),

	OPENS_IN_A_NEW_TAB: () =>
		/* translators: accessibility text appended to link text */
		__( '(opens in a new tab)' ),

	REMOVE: () => __( 'Remove' ),

	SEARCH: () => __( 'Search' ),

	SELECT: () => __( 'Select' ),
} satisfies Record< string, AnyMessage >;

export type { AnyMessage, Message } from './types';
export type UIMessages = typeof messages;

export default messages;
