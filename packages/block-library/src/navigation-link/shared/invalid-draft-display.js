/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Displays a label with an "(Invalid)" or "(Draft)" indicator for navigation links.
 *
 * @param {Object}  props           Component props.
 * @param {string}  props.label     The label text to display.
 * @param {boolean} props.isInvalid Whether the link is invalid (deleted or trashed).
 * @param {boolean} props.isDraft   Whether the link is a draft.
 * @param {string}  props.className Optional additional CSS class for the label element.
 *
 * @return {Element} The invalid/draft display component.
 */
export function InvalidDraftDisplay( {
	label,
	isInvalid,
	isDraft,
	className = 'wp-block-navigation-link__label',
} ) {
	// Only render if the link is invalid or a draft.
	if ( ! isInvalid && ! isDraft ) {
		return null;
	}

	const statusText = isInvalid
		? /* translators: Indicating that the navigation link is Invalid. */
		  __( 'Invalid' )
		: /* translators: Indicating that the navigation link is a Draft. */
		  __( 'Draft' );

	return (
		<div
			className={ clsx(
				'wp-block-navigation-link__placeholder-text',
				className,
				{
					'is-invalid': isInvalid,
					'is-draft': isDraft,
				}
			) }
		>
			<span>
				{
					// Some attributes are stored in an escaped form. It's a legacy issue.
					// Ideally they would be stored in a raw, unescaped form.
					// Unescape is used here to "recover" the escaped characters
					// so they display without encoding.
					// See `updateAttributes` for more details.
					`${ decodeEntities( label ) } (${ statusText })`.trim()
				}
			</span>
		</div>
	);
}
