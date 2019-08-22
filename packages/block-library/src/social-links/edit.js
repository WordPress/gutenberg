/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	IconButton,
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import {
	InnerBlocks,
} from '@wordpress/block-editor';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */

/**
 * Allowed blocks constant is passed to InnerBlocks precisely as specified here.
 * The contents of the array should never change.
 * The array should contain the name of each block that is allowed.
 * In columns block, the only block we allow is 'core/column'.
 *
 * @constant
 * @type {string[]}
 */
const ALLOWED_BLOCKS = [ 'core/social-link' ];
const TEMPLATE = [ [ 'core/social-link' ] ];

export const SocialLinksEdit = function( { className, clientId } ) {
	return (
		<>
			<div className={ className }>
				<InnerBlocks
					allowedBlocks={ ALLOWED_BLOCKS }
					template={ TEMPLATE }
					renderAppender={ () => (
						<IconButton
							isLarge
							label={ __( 'Add link' ) }
							icon="insert"
							onClick={ () => {
								const newLink = createBlock( 'core/social-link' );
								dispatch( 'core/block-editor' ).insertBlock( newLink, undefined, clientId );
							} } >
						</IconButton>
					) }
				/>
			</div>
		</>
	);
};

export default SocialLinksEdit;
