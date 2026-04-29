/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import {
	findMoreSuitableBlock,
	rewriteXToTwitter,
	removeAspectRatioClasses,
} from './util';

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
				const url = rewriteXToTwitter( node.textContent.trim() );
				return createBlock( EMBED_BLOCK, {
					url,
					...findMoreSuitableBlock( url )?.attributes,
				} );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			isMatch: ( { url } ) => !! url,
			transform: ( { url, caption, className } ) => {
				let value = `<a href="${ url }">${ url }</a>`;
				if ( caption?.trim() ) {
					value += `<br />${ caption }`;
				}
				return createBlock( 'core/paragraph', {
					content: value,
					className: removeAspectRatioClasses( className ),
				} );
			},
		},
	],
};

export default transforms;
