/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'enter',
			regExp: /\n$/,
			transform: ( { content } ) => [
				createBlock( 'core/verse', {
					content: content.replace( /\n$/, '' ),
				} ),
				createBlock( 'core/paragraph' ),
			],
		},
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) =>
				createBlock( 'core/verse', attributes ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) =>
				createBlock( 'core/paragraph', attributes ),
		},
	],
};

export default transforms;
