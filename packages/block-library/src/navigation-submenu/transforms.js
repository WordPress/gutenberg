/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/navigation-link' ],
			transform: ( attributes ) =>
				createBlock( 'core/navigation-link', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'core/spacer' ],
			transform: () => {
				return createBlock( 'core/spacer' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/site-logo' ],
			transform: () => {
				return createBlock( 'core/site-logo' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/home-link' ],
			transform: () => {
				return createBlock( 'core/home-link' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/social-links' ],
			transform: () => {
				return createBlock( 'core/social-links' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/search' ],
			transform: () => {
				return createBlock( 'core/search' );
			},
		},
	],
};

export default transforms;
