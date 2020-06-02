/**
 * WordPress dependencies
 */

import {
	InnerBlocks,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

const ALLOWED_BLOCKS = [ 'core/social-link' ];

// Template contains the links that show when start.
const TEMPLATE = [
	[
		'core/social-link',
		{ service: 'wordpress', url: 'https://wordpress.org' },
	],
	[ 'core/social-link', { service: 'facebook' } ],
	[ 'core/social-link', { service: 'twitter' } ],
	[ 'core/social-link', { service: 'instagram' } ],
	[ 'core/social-link', { service: 'linkedin' } ],
	[ 'core/social-link', { service: 'youtube' } ],
];

function SocialLinksEdit( { shouldDelete, onDelete } ) {
	return (
		<InnerBlocks
			allowedBlocks={ ALLOWED_BLOCKS }
			templateLock={ false }
			template={ TEMPLATE }
			__experimentalMoverDirection={ 'horizontal' }
			__experimentalTagName={ Block.ul }
			__experimentalAppenderTagName="li"
			onDeleteBlock={ shouldDelete ? onDelete : undefined }
		/>
	);
}

export default compose(
	withSelect( ( select, { clientId } ) => {
		const { getBlockCount } = select( 'core/block-editor' );

		return {
			shouldDelete: getBlockCount( clientId ) === 1,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		const { removeBlock } = dispatch( 'core/block-editor' );

		return {
			onDelete: () => {
				removeBlock( clientId );
			},
		};
	} )
)( SocialLinksEdit );
