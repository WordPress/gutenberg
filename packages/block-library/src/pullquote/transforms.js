/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( { value, citation } ) => {
				const paragraphs = [];
				if ( value ) {
					paragraphs.push(
						createBlock( 'core/paragraph', {
							content: value,
						} )
					);
				}
				if ( citation ) {
					paragraphs.push(
						createBlock( 'core/paragraph', {
							content: citation,
						} )
					);
				}
				if ( paragraphs.length === 0 ) {
					return createBlock( 'core/paragraph', {
						content: '',
					} );
				}
				return paragraphs;
			},
		},
		{
			type: 'block',
			blocks: [ 'core/heading' ],
			transform: ( { value, citation } ) => {
				// If there is no pullquote content, use the citation as the
				// content of the resulting heading. A nonexistent citation
				// will result in an empty heading.
				if ( ! value ) {
					return createBlock( 'core/heading', {
						content: citation,
					} );
				}
				const headingBlock = createBlock( 'core/heading', {
					content: value,
				} );
				if ( ! citation ) {
					return headingBlock;
				}
				return [
					headingBlock,
					createBlock( 'core/heading', {
						content: citation,
					} ),
				];
			},
		},
	],
};

export default transforms;
