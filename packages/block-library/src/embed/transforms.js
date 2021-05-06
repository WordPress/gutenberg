/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import metadata from './block.json';

const { name: EMBED_BLOCK } = metadata;

/**
 * Default transforms for generic embeds.
 */
const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: ( node ) =>
				node.nodeName === 'P' &&
				/^\s*(https?:\/\/\S+)\s*$/i.test( node.textContent ) &&
				node.textContent?.match( /https/gi )?.length === 1,
			transform: ( node ) => {
				return createBlock( EMBED_BLOCK, {
					url: node.textContent.trim(),
				} );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( { url, caption } ) => {
				const link = <a href={ url }>{ caption || url }</a>;
				return createBlock( 'core/paragraph', {
					content: renderToString( link ),
				} );
			},
		},
	],
};

export default transforms;
