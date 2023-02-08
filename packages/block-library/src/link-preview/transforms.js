/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Default transforms for generic embeds.
 */
const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			isMatch: ( { url } ) => !! url,
			transform: ( { url } ) => {
				return createBlock( 'core/paragraph', {
					content: `<a href="${ url }">${ url }</a>`,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/embed' ],
			transform: ( { url } ) => {
				return createBlock( 'core/embed', {
					url,
				} );
			},
		},
	],
	from: [
		{
			type: 'block',
			blocks: [ 'core/embed' ],
			transform: ( { url } ) => {
				return createBlock( 'core/link-preview', {
					url,
				} );
			},
		},
	],
};

export default transforms;
