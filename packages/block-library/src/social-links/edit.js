/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	IconButton,
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import {
	AlignmentToolbar,
	InnerBlocks,
	BlockControls,
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

export const SocialLinksEdit = function( { align, setAttributes, className, clientId } ) {
	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( nextAlign ) => setAttributes( { align: nextAlign } ) }
				/>
			</BlockControls>
			<div className={ className } style={ { textAlign: align } }>
				<InnerBlocks
					allowedBlocks={ ALLOWED_BLOCKS }
					renderAppender={ () => (
						<IconButton
							isLarge
							label={ __( 'Add link' ) }
							icon="insert"
							onClick={ () => {
								const newLink = createBlock( 'core/social-link' );
								dispatch( 'core/block-editor' ).insertBlock( newLink, undefined, clientId );
							} } >
							{ __( 'Add link' ) }
						</IconButton>
					) }
				/>
			</div>
		</>
	);
};

export default SocialLinksEdit;
