/**
 * External dependencies
 */
import classnames from 'classnames/dedupe';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';

export function getEmbedSaveComponent( options ) {
	const { save: customSave } = options;
	const saveComponent = ( { attributes } ) => {
		const { url, caption, type, providerNameSlug } = attributes;

		if ( ! url ) {
			return null;
		}

		const embedClassName = classnames( 'wp-block-embed', {
			[ `is-type-${ type }` ]: type,
			[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
		} );

		const urlLine = (
			<Fragment>
				{ `\n${ url }\n` /* URL needs to be on its own line. */ }
			</Fragment>
		);

		return (
			<figure className={ embedClassName }>
				<div className="wp-block-embed__wrapper">
					{ undefined !== customSave && customSave( attributes ) }
					{ undefined === customSave && urlLine }
				</div>
				{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" value={ caption } /> }
			</figure>
		);
	};
	return saveComponent;
}
