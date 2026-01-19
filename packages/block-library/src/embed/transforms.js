/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import { removeAspectRatioClasses } from './util';

const { name: EMBED_BLOCK } = metadata;

/**
 * Image file extensions that should not be treated as embeddable content.
 * These URLs should be handled by the Image block instead.
 */
const IMAGE_EXTENSIONS =
	/\.(?:jpe?g|png|gif|webp|avif|ico|heic|heif|bmp|tiff?)(?:\?.*)?$/i;

/**
 * Checks if a URL points directly to an image file.
 *
 * @param {string} url The URL to check.
 * @return {boolean} True if the URL appears to be a direct image URL.
 */
function isImageFileUrl( url ) {
	try {
		const { pathname } = new URL( url );
		return IMAGE_EXTENSIONS.test( pathname );
	} catch {
		return false;
	}
}

/**
 * Default transforms for generic embeds.
 */
const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: ( node ) =>
				node.nodeName === 'P' &&
				/^\s*(https?:\/\/\S+)\s*$/i.test( node.textContent ) &&
				node.textContent?.match( /https/gi )?.length === 1 &&
				! isImageFileUrl( node.textContent.trim() ),
			transform: ( node ) => {
				return createBlock( EMBED_BLOCK, {
					url: node.textContent.trim(),
				} );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			isMatch: ( { url } ) => !! url,
			transform: ( { url, caption, className } ) => {
				let value = `<a href="${ url }">${ url }</a>`;
				if ( caption?.trim() ) {
					value += `<br />${ caption }`;
				}
				return createBlock( 'core/paragraph', {
					content: value,
					className: removeAspectRatioClasses( className ),
				} );
			},
		},
	],
};

export default transforms;
