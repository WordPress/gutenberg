/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import {
	EditorQuoteIcon,
} from 'dashicons';

/**
 * Internal dependencies
 */
import { parse } from 'parsers/block';
import { serialize } from 'serializers/block';
import form from './form';

registerBlock( 'quote', {
	title: 'Quote',
	form: form,
	icon: EditorQuoteIcon,
	parse: ( rawBlock ) => {
		if (
			rawBlock.children.length !== 1 ||
			rawBlock.children[ 0 ].name !== 'p'
		) {
			return false;
		}

		return {
			blockType: 'quote',
			cite: rawBlock.attrs.cite || '',
			content: serialize( rawBlock.children ),
		};
	},
	serialize: ( block ) => {
		const children = parse( block.content );
		const rawHtml = serialize( children );

		return {
			type: 'WP_Block',
			blockType: 'quote',
			attrs: { cite: block.cite },
			startText: '<!-- wp:quote -->',
			endText: '<!-- /wp -->',
			rawContent: '<!-- wp:quote -->' + rawHtml + '<!-- /wp -->',
			children
		};
	}
} );
