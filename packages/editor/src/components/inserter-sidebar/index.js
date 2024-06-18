/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import {
	useViewportMatch,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { useCallback, useRef } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { ESCAPE } from '@wordpress/keycodes';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const { PrivateInserterLibrary } = unlock( blockEditorPrivateApis );

export default function InserterSidebar() {
	const {
		blockSectionRootClientId,
		inserterSidebarToggleRef,
		insertionPoint,
		showMostUsedBlocks,
		sidebarIsOpened,
	} = useSelect( ( select ) => {
		const {
			getInserterSidebarToggleRef,
			getInsertionPoint,
			isPublishSidebarOpened,
		} = unlock( select( editorStore ) );
		const { getBlockRootClientId, __unstableGetEditorMode, getSettings } =
			select( blockEditorStore );
		const { get } = select( preferencesStore );
		const { getActiveComplementaryArea } = select( interfaceStore );
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
			sidebarIsOpened: !! (
				getActiveComplementaryArea( 'core' ) || isPublishSidebarOpened()
			),
		};
	}, [] );
	const { setIsInserterOpened } = useDispatch( editorStore );
	const { disableComplementaryArea } = useDispatch( interfaceStore );

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
			<PrivateInserterLibrary
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
				onPatternCategorySelection={
					sidebarIsOpened
						? () => disableComplementaryArea( 'core' )
						: undefined
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
