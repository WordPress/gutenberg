/**
 * WordPress dependencies
 */

import { InnerBlocks } from '@wordpress/block-editor';

const ALLOWED_BLOCKS = [ 'core/social-link' ];

// Template contains the links that show when start.
const TEMPLATE = [
	[ 'core/social-link', { site: 'wordpress', url: 'https://wordpress.org' } ],
	[ 'core/social-link', { site: 'facebook' } ],
	[ 'core/social-link', { site: 'twitter' } ],
	[ 'core/social-link', { site: 'instagram' } ],
	[ 'core/social-link', { site: 'linkedin' } ],
	[ 'core/social-link', { site: 'youtube' } ],
];

export const SocialLinksEdit = function( { className } ) {
	return (
		<div className={ className }>
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				templateLock={ false }
				template={ TEMPLATE }
				__experimentalMoverDirection={ 'horizontal' }
			/>
		</div>
	);
};

export default SocialLinksEdit;
