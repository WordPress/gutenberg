/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	__experimentalLibrary as Library,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { useRef } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

export default function InserterSidebar( {
	closeGeneralSidebar,
	isRightSidebarOpen,
} ) {
	const { insertionPoint, showMostUsedBlocks, blockSectionRootClientId } =
		useSelect( ( select ) => {
			const { getInsertionPoint } = unlock( select( editorStore ) );
			const {
				getBlockRootClientId,
				__unstableGetEditorMode,
				getSettings,
			} = select( blockEditorStore );
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
				insertionPoint: getInsertionPoint(),
				showMostUsedBlocks: get( 'core', 'mostUsedBlocks' ),
				blockSectionRootClientId: getBlockSectionRootClientId(),
			};
		}, [] );
	const { setIsInserterOpened } = useDispatch( editorStore );

	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const libraryRef = useRef();

	return (
		<div
			ref={ inserterDialogRef }
			{ ...inserterDialogProps }
			className="editor-inserter-sidebar"
		>
			<div className="editor-inserter-sidebar__content">
				<Library
					showMostUsedBlocks={ showMostUsedBlocks }
					showInserterHelpPanel
					shouldFocusBlock={ isMobileViewport }
					rootClientId={
						blockSectionRootClientId ?? insertionPoint.rootClientId
					}
					__experimentalInsertionIndex={
						insertionPoint.insertionIndex
					}
					__experimentalFilterValue={ insertionPoint.filterValue }
					__experimentalOnPatternCategorySelection={
						isRightSidebarOpen ? closeGeneralSidebar : undefined
					}
					ref={ libraryRef }
					onClose={ () => setIsInserterOpened( false ) }
				/>
			</div>
		</div>
	);
}
