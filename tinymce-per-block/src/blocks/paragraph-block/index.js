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
			content: serialize( rawBlock.children[ 0 ].children ),
		};
	},
	serialize: ( block ) => {
		let children = parse( block.content );
		// Should probably be handled in the form
		children = children.length === 1 && children[ 0 ].name === 'p' ? children[ 0 ].children : children;
		const rawHtml = `<p style="text-align: ${ block.align };">${ serialize( children ) }</p>`;

		return {
			type: 'WP_Block',
			blockType: 'paragraph',
			attrs: { /* align: block.align */ },
			startText: '<!-- wp:paragraph -->',
			endText: '<!-- /wp -->',
			rawContent: '<!-- wp:paragraph -->' + rawHtml + '<!-- /wp -->',
			children: parse( rawHtml )
		};
	}
} );
