/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import metadata from './block.json';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

const { attributes: blockAttributes } = metadata;

// In #41140 support was added to global styles for caption elements which added a `wp-element-caption` classname
// to the embed figcaption element.
const v2 = {
	attributes: blockAttributes,
	save( { attributes } ) {
		const { url, caption, type, providerNameSlug } = attributes;

		if ( ! url ) {
			return null;
		}

		const className = clsx( 'wp-block-embed', {
			[ `is-type-${ type }` ]: type,
			[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
			[ `wp-block-embed-${ providerNameSlug }` ]: providerNameSlug,
		} );

		return (
			<figure { ...useBlockProps.save( { className } ) }>
				<div className="wp-block-embed__wrapper">
					{ `\n${ url }\n` /* URL needs to be on its own line. */ }
				</div>
				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		);
	},
};

const v1 = {
	attributes: blockAttributes,
	save( { attributes: { url, caption, type, providerNameSlug } } ) {
		if ( ! url ) {
			return null;
		}

		const embedClassName = clsx( 'wp-block-embed', {
			[ `is-type-${ type }` ]: type,
			[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
		} );

		return (
			<figure className={ embedClassName }>
				{ `\n${ url }\n` /* URL needs to be on its own line. */ }
				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		);
	},
};

const deprecated = [ v2, v1 ];

export default deprecated;
