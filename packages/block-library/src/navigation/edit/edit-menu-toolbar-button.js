/**
 * WordPress dependencies
 */
import {
	BlockControls,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { store as interfaceStore } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';

const EditMenuToolbarButton = () => {
 	// Blocks can be loaded into both post and site editors.
	// We use this to determine which editor we are in so that
	// we can determine which inspector controls to open.
	const {
		isPostEditor,
	} = useSelect(
		( select ) => {
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			const editorSelectors = select( 'core/editor' );
			return {
				isPostEditor: !! editorSelectors.getEditedPostAttribute( 'type' )
			};
		}
	);
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { openGeneralSidebar } = useDispatch( 'core/edit-post' );
	const openBlockInspector = () => {
		if ( isPostEditor ) {
			openGeneralSidebar( 'edit-post/block' );
		} else {
			enableComplementaryArea( 'core/edit-site', 'edit-site/block-inspector' );
		}
	};

	const isOffCanvasNavigationEditorEnabled =
		window?.__experimentalEnableOffCanvasNavigationEditor === true;

	if ( ! isOffCanvasNavigationEditorEnabled ) {
		return null;
	}

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					className="components-toolbar__control"
					label={ __( 'Open list view' ) }
					onClick={ openBlockInspector } // TODO - focus the menu part
				>
					{ __( 'Edit menu' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
};

export default EditMenuToolbarButton;
