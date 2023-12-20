/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { Button, VisuallyHidden } from '@wordpress/components';
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { close } from '@wordpress/icons';
import {
	useViewportMatch,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function InserterSidebar() {
	const { insertionPoint, showMostUsedBlocks } = useSelect( ( select ) => {
		const { isFeatureActive } = select( editPostStore );
		const { getInsertionPoint } = unlock( select( editorStore ) );
		return {
			insertionPoint: getInsertionPoint(),
			showMostUsedBlocks: isFeatureActive( 'mostUsedBlocks' ),
		};
	}, [] );
	const { setIsInserterOpened } = useDispatch( editorStore );

	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const TagName = ! isMobileViewport ? VisuallyHidden : 'div';
	const [ inserterDialogRef, inserterDialogProps ] = useDialog( {
		onClose: () => setIsInserterOpened( false ),
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
			className="edit-post-editor__inserter-panel"
		>
			<TagName className="edit-post-editor__inserter-panel-header">
				<Button
					icon={ close }
					label={ __( 'Close block inserter' ) }
					onClick={ () => setIsInserterOpened( false ) }
				/>
			</TagName>
			<div className="edit-post-editor__inserter-panel-content">
				<Library
					showMostUsedBlocks={ showMostUsedBlocks }
					showInserterHelpPanel
					shouldFocusBlock={ isMobileViewport }
					rootClientId={ insertionPoint.rootClientId }
					__experimentalInsertionIndex={
						insertionPoint.insertionIndex
					}
					__experimentalFilterValue={ insertionPoint.filterValue }
					ref={ libraryRef }
				/>
			</div>
		</div>
	);
}
