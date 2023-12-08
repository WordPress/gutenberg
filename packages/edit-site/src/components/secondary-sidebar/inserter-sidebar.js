/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Button, VisuallyHidden } from '@wordpress/components';
import {
	__experimentalLibrary as Library,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { close } from '@wordpress/icons';
import {
	useViewportMatch,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useCallback } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { useHasEditorCanvasContainer } from '../editor-canvas-container';
import { FOCUSABLE_ENTITIES } from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

export default function InserterSidebar() {
	const { closeGeneralSidebar, setIsInserterOpened } =
		useDispatch( editSiteStore );
	const insertionPoint = useSelect(
		( select ) => select( editSiteStore ).__experimentalGetInsertionPoint(),
		[]
	);
	const isFocusMode = useSelect( ( select ) =>
		FOCUSABLE_ENTITIES.includes(
			select( editSiteStore ).getEditedPostType()
		)
	);
	const isRightSidebarOpen = useSelect(
		( select ) =>
			!! select( interfaceStore ).getActiveComplementaryArea(
				editSiteStore.name
			),
		[]
	);
	const { __unstableSetEditorMode: setEditorMode } =
		useDispatch( blockEditorStore );
	const { __unstableGetEditorMode: getEditorMode } =
		useSelect( blockEditorStore );
	const hasEditorCanvasContainer = useHasEditorCanvasContainer();
	const location = useLocation();

	const isMobile = useViewportMatch( 'medium', '<' );
	const TagName = ! isMobile ? VisuallyHidden : 'div';
	const [ inserterDialogRef, inserterDialogProps ] = useDialog( {
		onClose: () => setIsInserterOpened( false ),
		focusOnMount: null,
		// Don't close the inserter on focus outside.
		// This is a temporary hack as we figure out the expected interactions
		// in the zoom-out mode.
		__unstableOnClose: ( eventName ) => {
			if ( eventName === 'focus-outside' ) {
				// Do nothing.
			}
		},
	} );

	const onSelectPatternCategory = useCallback(
		( category ) => {
			if ( !! category ) {
				closeGeneralSidebar();
			}
		},
		[ closeGeneralSidebar ]
	);

	const libraryRef = useRef();
	useEffect( () => {
		libraryRef.current.focusSearch();
	}, [] );

	const handleSelectTab = useCallback(
		( tab ) => {
			// Only enter the zoom-out mode when it's not in the focus mode.
			if ( ! hasEditorCanvasContainer && ! isFocusMode ) {
				// Enter the zoom-out mode when selecting the patterns tab and exit otherwise.
				if ( tab === 'patterns' ) {
					setEditorMode( 'zoom-out' );
				} else if ( getEditorMode() === 'zoom-out' ) {
					setEditorMode( 'edit' );
				}
			}
		},
		[ getEditorMode, setEditorMode, isFocusMode, hasEditorCanvasContainer ]
	);

	const previousLocationRef = useRef( location );
	useEffect(
		function closeInserterOnNavigate() {
			if ( location !== previousLocationRef.current ) {
				previousLocationRef.current = location;
				setIsInserterOpened( false );
			}
		},
		[ location, setIsInserterOpened ]
	);

	useEffect(
		function closePatternCategoryOnRightSidebarOpenInZoomOut() {
			if (
				getEditorMode() === 'zoom-out' &&
				isRightSidebarOpen &&
				!! libraryRef.current.getSelectedPatternCategory()
			) {
				libraryRef.current.selectPatternCategory( null );
			}
		},
		[ getEditorMode, isRightSidebarOpen ]
	);

	return (
		<div
			ref={ inserterDialogRef }
			{ ...inserterDialogProps }
			className="edit-site-editor__inserter-panel"
		>
			<TagName className="edit-site-editor__inserter-panel-header">
				<Button
					icon={ close }
					label={ __( 'Close block inserter' ) }
					onClick={ () => setIsInserterOpened( false ) }
				/>
			</TagName>
			<div className="edit-site-editor__inserter-panel-content">
				<Library
					showInserterHelpPanel
					shouldFocusBlock={ isMobile }
					rootClientId={ insertionPoint.rootClientId }
					__experimentalInsertionIndex={
						insertionPoint.insertionIndex
					}
					__experimentalFilterValue={ insertionPoint.filterValue }
					__experimentalOnPatternCategorySelection={
						onSelectPatternCategory
					}
					__experimentalShouldZoomPatterns
					ref={ libraryRef }
					onSelectTab={ handleSelectTab }
				/>
			</div>
		</div>
	);
}
