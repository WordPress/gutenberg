/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { VideoAlt3Icon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';
import { getEmbedHtmlFromUrl } from '../../utils/embed';

registerBlock( 'embed', {
	title: 'Embed',
	form: form,
	icon: VideoAlt3Icon,
	parse: ( rawBlock ) => {
		console.log( rawBlock );
		return {
			blockType: 'embed',
			url: rawBlock.attrs.url,
		};
	},
	serialize: ( block ) => {
		return {
			blockType: 'embed',
			attrs: { url: block.url },
			rawContent: getEmbedHtmlFromUrl( block.url )
		};
	}
} );
