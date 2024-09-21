/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [ 'core/paragraph', 'core/heading' ].map( ( blockName ) => ( {
		type: 'block',
		blocks: [ blockName ],
		transform: ( { content, anchor } ) =>
			createBlock( 'core/pullquote', { value: content, anchor } ),
	} ) ),
	to: [ 'core/paragraph', 'core/heading' ].map( ( blockName ) => ( {
		type: 'block',
		blocks: [ blockName ],
		transform: ( { value, citation } ) => {
			const paragraphs = [];
			if ( value ) {
				paragraphs.push( createBlock( blockName, { content: value } ) );
			}
			if ( citation ) {
				paragraphs.push(
					createBlock( 'core/paragraph', { content: citation } )
				);
			}
			return paragraphs.length === 0
				? createBlock( blockName, { content: '' } )
				: paragraphs;
		},
	} ) ),
};

export default transforms;
