/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { VideoAlt3Icon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';
import { getEmbedHtmlFromUrl } from 'utils/embed';
import { getFigureAlignmentStyles } from 'utils/figure-alignment';

registerBlock( 'embed', {
	title: 'Embed',
	form: form,
	icon: VideoAlt3Icon,
	parse: ( rawBlock ) => {
		const div = document.createElement( 'div' );
		div.innerHTML = rawBlock.rawContent;
		const captionNode = div.firstChild.nodeName === 'FIGURE'
			? div.firstChild.querySelector( 'figure > figcaption' )
			: null;
		const caption = captionNode ? captionNode.innerHTML : '';

		return {
			blockType: 'embed',
			url: rawBlock.attrs.url,
			align: rawBlock.attrs.align,
			caption
		};
	},
	serialize: ( block ) => {
		const styles = getFigureAlignmentStyles( block.align );
		const rawContent = [
			`<figure${ styles.figure }>`,
			`<div${ styles.content }>${ getEmbedHtmlFromUrl( block.url ) }</div>`,
			`<figcaption>${ block.caption }</figcaption>`,
			'</figure>'
		].join( '' );

		return {
			blockType: 'embed',
			attrs: { url: block.url, align: block.align },
			rawContent
		};
	},
	create: () => {
		return {
			blockType: 'embed',
			url: '',
			align: 'no-align',
			caption: ''
		};
	}
} );
