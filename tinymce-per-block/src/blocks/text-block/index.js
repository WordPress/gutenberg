/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { EditorTableIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import { parse } from 'parsers/block';
import { serialize } from 'serializers/block';
import form from './form';

registerBlock( 'text', {
	title: 'Text',
	form: form,
	icon: EditorTableIcon,
	parse: ( rawBlock ) => {
		return {
			blockType: 'text',
			align: rawBlock.attrs.align || 'no-align',
			content: serialize( rawBlock.children ),
		};
	},
	serialize: ( block ) => {
		const children = parse( block.content );
		const rawHtml = serialize( children );

		return {
			type: 'WP_Block',
			blockType: 'text',
			attrs: { /* align: block.align */ },
			startText: '<!-- wp:text -->',
			endText: '<!-- /wp -->',
			rawContent: '<!-- wp:text -->' + rawHtml + '<!-- /wp -->',
			children
		};
	}
} );
