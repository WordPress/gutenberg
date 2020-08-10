/**
 * External dependencies
 */
import classnames from 'classnames/dedupe';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { url, caption, type, providerNameSlug } = attributes;

	if ( ! url ) {
		return null;
	}

	const embedClassName = classnames( 'wp-block-embed', {
		[ `is-type-${ type }` ]: type,
		[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
		[ `wp-block-embed-${ providerNameSlug }` ]: providerNameSlug,
	} );

	return (
		<figure className={ embedClassName }>
			<div className="wp-block-embed__wrapper">
				{ `\n${ url }\n` /* URL needs to be on its own line. */ }
			</div>
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
}
