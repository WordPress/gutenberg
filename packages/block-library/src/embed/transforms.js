/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { toHTMLString, removeFormat, create } from '@wordpress/rich-text';

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
			isMatch: ( { url } ) => !! url,
			transform: ( { url, caption } ) => {
				let linkText = url;
				if ( caption?.trim() ) {
					const captionEl = create( { html: caption } );
					linkText = toHTMLString( {
						value: removeFormat(
							captionEl,
							'core/link',
							0,
							captionEl.text.length
						),
					} );
				}
				const link = create( {
					html: `<a href="${ url }">${ linkText }</a>`,
				} );
				return createBlock( 'core/paragraph', {
					content: toHTMLString( { value: link } ),
				} );
			},
		},
	],
};

export default transforms;
