/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { close } from '@wordpress/icons';
import {
	__experimentalLibrary as Library,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editNavigationStore } from '../../store';
import { useNavigationEditorInsertionPoint } from '../../hooks';

function InserterSidebar() {
	const SHOW_PREVIEWS = false;

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	const { rootClientId } = useNavigationEditorInsertionPoint();

	const { isInserterOpened, hasInserterItems } = useSelect( ( select ) => {
		return {
			hasInserterItems: select( blockEditorStore ).hasInserterItems(
				rootClientId
			),
			isInserterOpened: select( editNavigationStore ).isInserterOpened(),
		};
	} );

	const { setIsInserterOpened } = useDispatch( editNavigationStore );

	const inserterDialogProps = {};

	if ( ! isInserterOpened || ! hasInserterItems ) {
		return null;
	}

	return (
		<div
			{ ...inserterDialogProps }
			className="edit-widgets-layout__inserter-panel"
		>
			<div className="edit-widgets-layout__inserter-panel-header">
				<Button
					icon={ close }
					onClick={ () => setIsInserterOpened( false ) }
				/>
			</div>
			<div className="edit-widgets-layout__inserter-panel-content">
				<Library
					shouldFocusBlock={ isMobileViewport }
					rootClientId={ rootClientId }
					clientId={ rootClientId }
					showInserterHelpPanel={ SHOW_PREVIEWS }
				/>
			</div>
		</div>
	);
}

export default InserterSidebar;
