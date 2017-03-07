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
			? div.firstChild.childNodes[ 1 ].innerHTML
			: '';

		return {
			blockType: 'image',
			align: rawBlock.attrs.align || 'no-align',
			src,
			caption
		};
	},
	serialize: ( block ) => {
		const styles = {
			'align-left': {
				figure: 'float: left;'
			},
			'align-right': {
				figure: 'float: right;'
			},
			'align-full-width': {
				figure: 'margin-left: calc(50% - 50vw);width: 100vw;max-width: none;padding-left: 0;padding-right: 0;',
				img: 'width: 100%'
			}
		};
		const figureStyle = styles[ block.align ] && styles[ block.align ].figure
			? ` style="${ styles[ block.align ].figure }"`
			: '';
		const imgStyle = styles[ block.align ] && styles[ block.align ].img
			? ` style="${ styles[ block.align ].img }"`
			: '';
		const captionHtml = block.caption ? `<figcaption>${ block.caption }</figcaption>` : '';
		const rawContent = `<figure${ figureStyle }><img src="${ block.src }"${ imgStyle } />${ captionHtml }</figure>`;

		return {
			blockType: 'image',
			attrs: { /* caption: block.caption ,*/ align: block.align },
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
