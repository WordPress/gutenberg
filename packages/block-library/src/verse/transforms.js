/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) =>
				createBlock( 'core/verse', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'core/quote' ],
			transform: ( {}, innerBlocks ) => {
				// Extract content from the quote's inner blocks
				const content = innerBlocks
					.map( ( { attributes } ) => attributes.content || '' )
					.filter( Boolean )
					.join( '<br>' );
				return createBlock( 'core/verse', { content } );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			priority: 10,
			transform: ( attributes ) =>
				createBlock( 'core/paragraph', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'core/quote' ],
			priority: 10,
			transform: ( { content } ) =>
				createBlock( 'core/quote', {}, [
					createBlock( 'core/paragraph', { content } ),
				] ),
		},
	],
};

export default transforms;
