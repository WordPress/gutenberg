/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/navigation-link' ],
			isMatch: ( attributes, block ) => block?.innerBlocks?.length === 0,
			transform: ( attributes ) =>
				createBlock( 'core/navigation-link', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'core/spacer' ],
			isMatch: ( attributes, block ) => block?.innerBlocks?.length === 0,
			transform: () => {
				return createBlock( 'core/spacer' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/site-logo' ],
			isMatch: ( attributes, block ) => block?.innerBlocks?.length === 0,
			transform: () => {
				return createBlock( 'core/site-logo' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/home-link' ],
			isMatch: ( attributes, block ) => block?.innerBlocks?.length === 0,
			transform: () => {
				return createBlock( 'core/home-link' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/social-links' ],
			isMatch: ( attributes, block ) => block?.innerBlocks?.length === 0,
			transform: () => {
				return createBlock( 'core/social-links' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/search' ],
			isMatch: ( attributes, block ) => block?.innerBlocks?.length === 0,
			transform: () => {
				return createBlock( 'core/search' );
			},
		},
	],
};

export default transforms;
