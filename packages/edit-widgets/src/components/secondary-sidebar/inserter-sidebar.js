/**
 * WordPress dependencies
 */
import { Button, VisuallyHidden } from '@wordpress/components';
import { close } from '@wordpress/icons';
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import {
	useViewportMatch,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

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

	const TagName = ! isMobileViewport ? VisuallyHidden : 'div';
	const [ inserterDialogRef, inserterDialogProps ] = useDialog( {
		onClose: closeInserter,
		focusOnMount: null,
	} );

	const libraryRef = useRef();
	useEffect( () => {
		libraryRef.current.focusSearch();
	}, [] );

	return (
		<div
			ref={ inserterDialogRef }
			{ ...inserterDialogProps }
			className="edit-widgets-layout__inserter-panel"
		>
			<TagName className="edit-widgets-layout__inserter-panel-header">
				<Button
					icon={ close }
					onClick={ closeInserter }
					label={ __( 'Close block inserter' ) }
				/>
			</TagName>
			<div className="edit-widgets-layout__inserter-panel-content">
				<Library
					showInserterHelpPanel
					shouldFocusBlock={ isMobileViewport }
					rootClientId={ rootClientId }
					__experimentalInsertionIndex={ insertionIndex }
					ref={ libraryRef }
				/>
			</div>
		</div>
	);
}
