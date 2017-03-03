/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { FormatImageIcon } from 'dashicons';

import { parse } from 'parsers/block';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'image', {
	title: 'Image',
	icon: FormatImageIcon,
	form,
	parse: ( rawBlock ) => {
		if (
			rawBlock.children.length !== 1 ||
			rawBlock.children[ 0 ].name !== 'img'
		) {
			return false;
		}

		return {
			blockType: 'image',
			src: rawBlock.children[ 0 ].attrs.src,
			caption: rawBlock.children[ 0 ].attrs.caption || '',
			align: rawBlock.children[ 0 ].attrs.align || 'no-align'
		};
	},
	serialize: ( block ) => {
		const rawHtml = `<img src="${ block.src }">`;

		return {
			type: 'WP_Block',
			blockType: 'image',
			attrs: { /* caption: block.caption , align: block.align */ },
			startText: '<!-- wp:image -->',
			endText: '<!-- /wp -->',
			rawContent: '<!-- wp:image -->' + rawHtml + '<!-- /wp -->',
			children: parse( rawHtml )
		};
	}
} );
