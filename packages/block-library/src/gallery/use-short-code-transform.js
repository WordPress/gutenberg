/**
 * External dependencies
 */
import { every } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

export default function useShortCodeTransform(
	shortCodeTransforms,
	getMedia,
	setAttributes,
	replaceInnerBlocks,
	clientId
) {
	if ( ! shortCodeTransforms || shortCodeTransforms.length === 0 ) {
		return;
	}
	const newImageData = shortCodeTransforms.map( ( image ) => {
		return getMedia( image.id );
	} );
	if ( every( newImageData, ( img ) => img && img.source_url ) ) {
		const newBlocks = newImageData.map( ( image ) => {
			return createBlock( 'core/image', {
				inheritedAttributes: {
					linkDestination: true,
					linkTarget: true,
					sizeSlug: true,
				},
				id: image.id,
				url: image.source_url,
			} );
		} );
		replaceInnerBlocks( clientId, newBlocks );
		setAttributes( { shortCodeTransforms: undefined } );
	}
}
