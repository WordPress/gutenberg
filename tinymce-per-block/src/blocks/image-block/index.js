/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { FormatImageIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';
import { getFigureAlignmentStyles } from 'utils/figure-alignment';

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
			? div.firstChild.childNodes[ 1 ].innerHTML
			: '';

		return {
			blockType: 'image',
			align: rawBlock.attrs.align,
			src,
			caption
		};
	},
	serialize: ( block ) => {
		const styles = getFigureAlignmentStyles( block.align );
		const captionHtml = block.caption ? `<figcaption>${ block.caption }</figcaption>` : '';
		const rawContent = [
			`<figure${ styles.figure }>`,
			`<img src="${ block.src }"${ styles.content } />`,
			captionHtml,
			'</figure>'
		].join( '' );

		return {
			blockType: 'image',
			attrs: { align: block.align },
			rawContent
		};
	},
	create: () => {
		return {
			blockType: 'image',
			src: '',
			caption: '',
			align: 'no-align'
		};
	}
} );
