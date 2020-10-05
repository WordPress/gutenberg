/**
 * External dependencies
 */
import { truncate } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

export default function ThemePreview( {
	theme: { author, description, name, screenshot, version },
} ) {
	return (
		<div className="edit-site-navigation-panel__preview">
			<span
				className="edit-site-template-switcher__theme-preview-name"
				dangerouslySetInnerHTML={ {
					/* name.rendered is sanitized on the server side. */
					__html: name.rendered,
				} }
			/>{ ' ' }
			<span className="edit-site-template-switcher__theme-preview-version">
				{ 'v' + version }
			</span>
			<div className="edit-site-template-switcher__theme-preview-byline">
				{
					// translators: %s: theme author name.
					sprintf( __( 'By %s' ), [ author.raw ] )
				}
			</div>
			<img
				className="edit-site-template-switcher__theme-preview-screenshot"
				src={ screenshot }
				alt={ __( 'Theme Preview' ) }
			/>
			<div className="edit-site-template-switcher__theme-preview-description">
				{ truncate(
					// We can't use `description.rendered` here because we are truncating the string
					// `description.rendered` might contain HTML tags which doesn't play nicely with truncating
					// truncate function might truncate in the middle of an HTML tag so we never
					// close the HTML tag we are already in
					description.raw,
					{
						length: 120,
						separator: /\. +/,
					}
				) }
			</div>
		</div>
	);
}
