/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import metadata from './block.json';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

const { attributes: blockAttributes } = metadata;

const deprecated = [
	{
		attributes: blockAttributes,
		save( { attributes: { url, caption, type, providerNameSlug } } ) {
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
					{ ! RichText.isEmpty( caption ) && (
						<RichText.Content
							tagName="figcaption"
							value={ caption }
						/>
					) }
				</figure>
			);
		},
	},
];

export default deprecated;
