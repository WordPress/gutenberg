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
 * Displays a label with a "(Needs update)" indicator
 * for legacy navigation links without dynamic bindings.
 *
 * @param {Object} props           Component props.
 * @param {string} props.label     The label text to display.
 * @param {string} props.className Optional additional CSS class for the label element.
 *
 * @return {Element} The needs update display component.
 */
export function NeedsUpdateDisplay( {
	label,
	className = 'wp-block-navigation-link__label',
} ) {
	return (
		<div
			className={ clsx(
				'wp-block-navigation-link__placeholder-text',
				className,
				'is-needs-update'
			) }
		>
			<span>
				{ `${ decodeEntities( label ) } (${ __(
					'Needs update'
				) })`.trim() }
			</span>
		</div>
	);
}
