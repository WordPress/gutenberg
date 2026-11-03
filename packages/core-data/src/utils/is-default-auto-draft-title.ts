import { __ } from '@wordpress/i18n';

/**
 * Checks whether a title is the default placeholder WordPress assigns to
 * auto-drafts created in the admin (`get_default_post_to_edit()` inserts
 * `__( 'Auto Draft' )`).
 *
 * The stored placeholder is localized in the locale of the user who created
 * the post, so the comparison checks both the English string and the current
 * user's translation. Auto-drafts created programmatically with a meaningful
 * title do not match and must be left untouched.
 *
 * @param title Title to check.
 *
 * @return Whether the title is the default auto-draft placeholder.
 */
export default function isDefaultAutoDraftTitle( title: unknown ): boolean {
	return title === 'Auto Draft' || title === __( 'Auto Draft' );
}
