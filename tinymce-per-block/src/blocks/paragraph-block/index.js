/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { EditorParagraphIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';
import { parse } from 'parsers/block';
import { serialize } from 'serializers/block';

registerBlock( 'paragraph', {
	title: 'Paragraph',
	form: form,
	icon: EditorParagraphIcon,
	parse: ( rawBlock ) => {
		if (
			rawBlock.children.length !== 1 ||
			rawBlock.children[ 0 ].name !== 'p'
		) {
			return false;
		}

		return {
			blockType: 'paragraph',
			align: rawBlock.attrs.align || 'no-align',
			content: serialize( rawBlock.children ),
		};
	},
	serialize: ( block ) => {
		const children = parse( block.content );
		const rawHtml = serialize( children );

		return {
			type: 'WP_Block',
			blockType: 'paragraph',
			attrs: { /* align: block.align */ },
			startText: '<!-- wp:paragraph -->',
			endText: '<!-- /wp -->',
			rawContent: '<!-- wp:paragraph -->' + rawHtml + '<!-- /wp -->',
			children
		};
	}
} );
