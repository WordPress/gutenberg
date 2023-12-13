/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import {
	PostFeaturedImage,
	PostFeaturedImageCheck,
	store as editorStore,
} from '@wordpress/editor';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Module Constants
 */
const PANEL_NAME = 'featured-image';

function FeaturedImage( { isEnabled, isOpened, postType, onTogglePanel } ) {
	if ( ! isEnabled ) {
		return null;
	}

	return (
		<PostFeaturedImageCheck>
			<PanelBody
				title={
					postType?.labels?.featured_image ?? __( 'Featured image' )
				}
				opened={ isOpened }
				onToggle={ onTogglePanel }
			>
				<PostFeaturedImage />
			</PanelBody>
		</PostFeaturedImageCheck>
	);
}

const applyWithSelect = withSelect( ( select ) => {
	const {
		getEditedPostAttribute,
		isEditorPanelEnabled,
		isEditorPanelOpened,
	} = select( editorStore );
	const { getPostType } = select( coreStore );

	return {
		postType: getPostType( getEditedPostAttribute( 'type' ) ),
		isEnabled: isEditorPanelEnabled( PANEL_NAME ),
		isOpened: isEditorPanelOpened( PANEL_NAME ),
	};
} );

const applyWithDispatch = withDispatch( ( dispatch ) => {
	const { toggleEditorPanelOpened } = dispatch( editorStore );

	return {
		onTogglePanel: ( ...args ) =>
			toggleEditorPanelOpened( PANEL_NAME, ...args ),
	};
} );

export default compose( applyWithSelect, applyWithDispatch )( FeaturedImage );
