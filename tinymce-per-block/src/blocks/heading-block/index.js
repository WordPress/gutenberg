/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { EditorHeadingIcon } from 'dashicons';

import { parse } from 'parsers/block';
import { serialize } from 'serializers/block';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'heading', {
	title: 'Heading',
	form: form,
	icon: EditorHeadingIcon,
	parse: ( rawBlock ) => {
		const nodeNames = [ 'h1', 'h2', 'h3' ];
		if (
			rawBlock.children.length !== 1 ||
			nodeNames.indexOf( rawBlock.children[ 0 ].name ) === -1
		) {
			return false;
		}

		return {
			blockType: 'heading',
			content: serialize( rawBlock.children[ 0 ].children ),
			size: rawBlock.children[ 0 ].name
		};
	},
	serialize: ( block ) => {
		const elementName = block.size ? block.size : 'h2';
		const rawHtml = `<${ elementName }>` + block.content + `</${ elementName }>`;

		return {
			type: 'WP_Block',
			blockType: 'heading',
			attrs: { size: elementName },
			startText: '<!-- wp:heading -->',
			endText: '<!-- /wp -->',
			rawContent: '<!-- wp:heading -->' + rawHtml + '<!-- /wp -->',
			children: parse( rawHtml )
		};
	}
} );
