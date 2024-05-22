/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	__experimentalLibrary as Library,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	useViewportMatch,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { useCallback, useRef } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

export default function InserterSidebar( {
	closeGeneralSidebar,
	isRightSidebarOpen,
} ) {
	const {
		blockSectionRootClientId,
		inserterSidebarToggleRef,
		insertionPoint,
		showMostUsedBlocks,
	} = useSelect( ( select ) => {
		const { getInserterSidebarToggleRef, getInsertionPoint } = unlock(
			select( editorStore )
		);
		const { getBlockRootClientId, __unstableGetEditorMode, getSettings } =
			select( blockEditorStore );
		const { get } = select( preferencesStore );
		const getBlockSectionRootClientId = () => {
			if ( __unstableGetEditorMode() === 'zoom-out' ) {
				const { sectionRootClientId } = unlock( getSettings() );
				if ( sectionRootClientId ) {
					return sectionRootClientId;
				}
			}
			return getBlockRootClientId();
		};
		return {
			inserterSidebarToggleRef: getInserterSidebarToggleRef(),
			insertionPoint: getInsertionPoint(),
			showMostUsedBlocks: get( 'core', 'mostUsedBlocks' ),
			blockSectionRootClientId: getBlockSectionRootClientId(),
		};
	}, [] );
	const { setIsInserterOpened } = useDispatch( editorStore );

	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ inserterDialogRef, inserterDialogProps ] = useDialog( {
		onClose: () => setIsInserterOpened( false ),
		focusOnMount: true,
	} );
	const libraryRef = useRef();

	// When closing the inserter, focus should return to the toggle button.
	const closeInserterSidebar = useCallback( () => {
		setIsInserterOpened( false );
		inserterSidebarToggleRef.current?.focus();
	}, [ inserterSidebarToggleRef, setIsInserterOpened ] );

	const closeOnEscape = useCallback(
		( event ) => {
			if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
				event.preventDefault();
				closeInserterSidebar();
			}
		},
		[ closeInserterSidebar ]
	);

	const inserterContents = (
		<div className="editor-inserter-sidebar__content">
			<Library
				showMostUsedBlocks={ showMostUsedBlocks }
				showInserterHelpPanel
				shouldFocusBlock={ isMobileViewport }
				rootClientId={
					blockSectionRootClientId ?? insertionPoint.rootClientId
				}
				__experimentalInsertionIndex={ insertionPoint.insertionIndex }
				__experimentalInitialTab={ insertionPoint.tab }
				__experimentalInitialCategory={ insertionPoint.category }
				__experimentalFilterValue={ insertionPoint.filterValue }
				__experimentalOnPatternCategorySelection={
					isRightSidebarOpen ? closeGeneralSidebar : undefined
				}
				ref={ libraryRef }
				onClose={ closeInserterSidebar }
			/>
		</div>
	);

	if ( window.__experimentalEnableZoomedOutPatternsTab ) {
		return (
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div
				onKeyDown={ closeOnEscape }
				className="editor-inserter-sidebar"
			>
				{ inserterContents }
			</div>
		);
	}
	return (
		<div
			ref={ inserterDialogRef }
			{ ...inserterDialogProps }
			className="editor-inserter-sidebar"
		>
			{ inserterContents }
		</div>
	);
}
