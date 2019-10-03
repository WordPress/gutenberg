/**
 * WordPress dependencies
 */

import {
	InnerBlocks,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import socialList from '../social-link/social-list';

const ALLOWED_BLOCKS = Object.keys( socialList ).map( ( site ) => {
	return 'core/social-link-' + site;
} );

// Template contains the links that show when start.
const TEMPLATE = [
	[ 'core/social-link-wordpress', { url: 'https://wordpress.org' } ],
	[ 'core/social-link-facebook' ],
	[ 'core/social-link-twitter' ],
	[ 'core/social-link-instagram' ],
	[ 'core/social-link-linkedin' ],
	[ 'core/social-link-youtube' ],
];

export const SocialLinksEdit = function( { className } ) {
	const moverOptions = {
		position: 'inside',
		orientation: 'horizontal',
	};
	return (
		<div className={ className }>
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				templateLock={ false }
				template={ TEMPLATE }
				moverOptions={ moverOptions }
			/>
		</div>
	);
};

export default SocialLinksEdit;
