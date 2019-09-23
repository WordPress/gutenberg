/**
 * WordPress dependencies
 */

import {
	InnerBlocks,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
const ALLOWED_BLOCKS = [ 'core/button' ];

// Template contains the links that show when start.
const TEMPLATE = [
	[ 'core/button' ],
];

export const ButtonsEdit = function( { className } ) {
	return (
		<div className={ className }>
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				templateLock={ false }
				template={ TEMPLATE }
			/>
		</div>
	);
};

export default ButtonsEdit;
