/**
 * External dependencies
 */
import { truncate } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

function ThemePreview( {
	theme: {
		author_name: authorName,
		author_uri: authorUri,
		description,
		name,
		screenshot,
		version,
	},
} ) {
	return (
		<div className="edit-site-template-switcher__theme-preview">
			<span className="edit-site-template-switcher__theme-preview-name">
				{ name }
			</span>{ ' ' }
			<span className="edit-site-template-switcher__theme-preview-version">
				{ 'v' + version }
			</span>
			<div className="edit-site-template-switcher__theme-preview-byline">
				{ createInterpolateElement(
					// translators: %s: theme author name.
					sprintf( __( 'By <a>%s</a>' ), [ authorName ] ),
					{
						// eslint-disable-next-line jsx-a11y/anchor-has-content
						a: <a href={ authorUri } />,
					}
				) }
			</div>
			<img
				className="edit-site-template-switcher__theme-preview-screenshot"
				src={ screenshot }
				alt={ 'Theme Preview' }
			/>
			<div className="edit-site-template-switcher__theme-preview-description">
				{ truncate( description, {
					length: 120,
					separator: /\. +/,
				} ) }
			</div>
		</div>
	);
}

export default ThemePreview;
