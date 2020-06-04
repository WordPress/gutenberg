/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Default transforms for generic embeds.
 */
const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: ( node ) =>
				node.nodeName === 'P' &&
				/^\s*(https?:\/\/\S+)\s*$/i.test( node.textContent ),
			transform: ( node ) => {
				return createBlock( 'core/embed', {
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
