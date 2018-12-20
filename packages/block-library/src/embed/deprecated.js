/**
 * Internal dependencies
 */
import { getEmbedSaveComponent } from './save';

/**
 * External dependencies
 */
import classnames from 'classnames/dedupe';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/editor';

export const getEmbedDeprecatedMigrations = ( embedAttributes, options ) => {
	const deprecated = [
		{
			attributes: embedAttributes,
			save( { attributes } ) {
				const { url, caption, type, providerNameSlug } = attributes;

				if ( ! url ) {
					return null;
				}

				const embedClassName = classnames( 'wp-block-embed', {
					[ `is-type-${ type }` ]: type,
					[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
				} );

				return (
					<figure className={ embedClassName }>
						{ `\n${ url }\n` /* URL needs to be on its own line. */ }
						{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
					</figure>
				);
			},
		},
	];

	if ( undefined === options.save ) {
		return deprecated;
	}
	const extraDeprecated = options.deprecated || [];
	return [
		...deprecated,
		...extraDeprecated,
		{
			attributes: embedAttributes,
			save: getEmbedSaveComponent( {} ),
		},
	];
};
