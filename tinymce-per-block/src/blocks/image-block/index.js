/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { FormatImageIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'image', {
	title: 'Image',
	icon: FormatImageIcon,
	form,
	parse: ( rawBlock ) => {
		const div = document.createElement( 'div' );
		div.innerHTML = rawBlock.rawContent;
		if (
			div.childNodes.length !== 1 ||
			! (
				div.firstChild.nodeName === 'IMG' ||
				(
					div.firstChild.nodeName === 'FIGURE' &&
					div.firstChild.childNodes.length &&
					div.firstChild.firstChild.nodeName === 'IMG'
				)
			)
		) {
			return false;
		}

		const src = div.firstChild.nodeName === 'IMG'
			? div.firstChild.getAttribute( 'src' )
			: div.firstChild.firstChild.getAttribute( 'src' );

		const caption = div.firstChild.childNodes.length > 1
			? rawBlock.firstChild.childNodes[ 1 ].innerHTML
			: '';

		return {
			blockType: 'image',
			align: rawBlock.attrs.align || 'no-align',
			src,
			caption
		};
	},
	serialize: ( block ) => {
		const captionHtml = block.caption ? `<figcaption>${ block.caption }</figcaption>` : '';
		const rawContent = `<figure><img src="${ block.src }" />${ captionHtml }</figure>`;

		return {
			blockType: 'image',
			attrs: { /* caption: block.caption , align: block.align */ },
			rawContent
		};
	}
} );
