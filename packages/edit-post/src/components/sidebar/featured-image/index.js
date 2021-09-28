/**
 * External dependencies
 */
import { get, partial } from 'lodash';

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
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

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
				title={ get(
					postType,
					[ 'labels', 'featured_image' ],
					__( 'Featured image' )
				) }
				opened={ isOpened }
				onToggle={ onTogglePanel }
			>
				<PostFeaturedImage />
			</PanelBody>
		</PostFeaturedImageCheck>
	);
}

const applyWithSelect = withSelect( ( select ) => {
	const { getEditedPostAttribute } = select( editorStore );
	const { getPostType } = select( coreStore );
	const { isEditorPanelEnabled, isEditorPanelOpened } = select(
		editPostStore
	);

	return {
		postType: getPostType( getEditedPostAttribute( 'type' ) ),
		isEnabled: isEditorPanelEnabled( PANEL_NAME ),
		isOpened: isEditorPanelOpened( PANEL_NAME ),
	};
} );

const applyWithDispatch = withDispatch( ( dispatch ) => {
	const { toggleEditorPanelOpened } = dispatch( editPostStore );

	return {
		onTogglePanel: partial( toggleEditorPanelOpened, PANEL_NAME ),
	};
} );

export default compose( applyWithSelect, applyWithDispatch )( FeaturedImage );
