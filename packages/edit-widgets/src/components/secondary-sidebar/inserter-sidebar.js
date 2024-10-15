/**
 * WordPress dependencies
 */
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import {
	useViewportMatch,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { useCallback, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useWidgetLibraryInsertionPoint from '../../hooks/use-widget-library-insertion-point';
import { store as editWidgetsStore } from '../../store';

export default function InserterSidebar() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { rootClientId, insertionIndex } = useWidgetLibraryInsertionPoint();

	const { setIsInserterOpened } = useDispatch( editWidgetsStore );

	const closeInserter = useCallback( () => {
		return setIsInserterOpened( false );
	}, [ setIsInserterOpened ] );

	const [ inserterDialogRef, inserterDialogProps ] = useDialog( {
		onClose: closeInserter,
		focusOnMount: true,
	} );

	const libraryRef = useRef();

	return (
		<div
			ref={ inserterDialogRef }
			{ ...inserterDialogProps }
			className="edit-widgets-layout__inserter-panel"
		>
			<div className="edit-widgets-layout__inserter-panel-content">
				<Library
					showInserterHelpPanel
					shouldFocusBlock={ isMobileViewport }
					rootClientId={ rootClientId }
					__experimentalInsertionIndex={ insertionIndex }
					ref={ libraryRef }
					onClose={ closeInserter }
				/>
			</div>
		</div>
	);
}
