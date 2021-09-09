/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { close } from '@wordpress/icons';
import {
	__experimentalLibrary as Library,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	useViewportMatch,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editNavigationStore } from '../../store';
import { useNavigationEditorRootBlock } from '../../hooks';

function InserterSidebar() {
	const SHOW_PREVIEWS = false;

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	const {
		navBlockClientId,
		lastNavBlockItemIndex,
	} = useNavigationEditorRootBlock();

	const { hasInserterItems, selectedBlockClientId } = useSelect(
		( select ) => {
			return {
				hasInserterItems: select( blockEditorStore ).hasInserterItems(
					navBlockClientId
				),
				selectedBlockClientId: select(
					blockEditorStore
				).getSelectedBlock()?.clientId,
			};
		},
		[]
	);

	const { setIsInserterOpened } = useDispatch( editNavigationStore );

	const [ inserterDialogRef, inserterDialogProps ] = useDialog( {
		onClose: () => setIsInserterOpened( false ),
	} );

	// Only concerned with whether there are items to display. If not then
	// we shouldn't render.
	if ( ! hasInserterItems ) {
		return null;
	}

	const isNavBlockSelected = navBlockClientId === selectedBlockClientId;

	return (
		<div
			ref={ inserterDialogRef }
			{ ...inserterDialogProps }
			className="edit-navigation-layout__inserter-panel"
		>
			<div className="edit-navigation-layout__inserter-panel-header">
				<Button
					icon={ close }
					onClick={ () => setIsInserterOpened( false ) }
				/>
			</div>
			<div className="edit-navigation-layout__inserter-panel-content">
				<Library
					shouldFocusBlock={ isMobileViewport }
					rootClientId={ navBlockClientId }
					// If the root Nav block is selected then any items inserted by the
					// global inserter should append after the last nav item. Otherwise
					// simply allow default Gutenberg behaviour.
					__experimentalInsertionIndex={
						isNavBlockSelected ? lastNavBlockItemIndex : undefined
					}
					showInserterHelpPanel={ SHOW_PREVIEWS }
				/>
			</div>
		</div>
	);
}

export default InserterSidebar;
