/**
 * WordPress dependencies
 */
import {
	DropZoneProvider,
	Popover,
	SlotFillProvider,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockInspector,
	__unstableUseBlockSelectionClearer as useBlockSelectionClearer,
} from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationEditor from './use-navigation-editor';
import useNavigationBlockEditor from './use-navigation-block-editor';
import useMenuNotifications from './use-menu-notifications';
import ErrorBoundary from '../error-boundary';
import NavigationEditorShortcuts from './shortcuts';
import Header from '../header';
import Notices from '../notices';
import Editor from '../editor';
import InspectorAdditions from '../inspector-additions';
import { store as editNavigationStore } from '../../store';

export default function Layout( { blockEditorSettings } ) {
	const canvasRef = useRef();
	useBlockSelectionClearer( canvasRef );

	const { saveNavigationPost } = useDispatch( editNavigationStore );
	const savePost = () => saveNavigationPost( navigationPost );

	const {
		menus,
		selectedMenuId,
		navigationPost,
		selectMenu,
		deleteMenu,
		hasLoadedMenus,
	} = useNavigationEditor();

	const [ blocks, onInput, onChange ] = useNavigationBlockEditor(
		navigationPost
	);

	useMenuNotifications( selectedMenuId );

	return (
		<ErrorBoundary>
			<SlotFillProvider>
				<DropZoneProvider>
					<BlockEditorKeyboardShortcuts.Register />
					<NavigationEditorShortcuts.Register />

					<Notices />

					<div className="edit-navigation-layout">
						<Header
							isPending={ ! hasLoadedMenus }
							menus={ menus }
							selectedMenuId={ selectedMenuId }
							onSelectMenu={ selectMenu }
							navigationPost={ navigationPost }
						/>

						<BlockEditorProvider
							value={ blocks }
							onInput={ onInput }
							onChange={ onChange }
							settings={ {
								...blockEditorSettings,
								templateLock: 'all',
							} }
							useSubRegistry={ false }
						>
							<BlockEditorKeyboardShortcuts />
							<NavigationEditorShortcuts
								saveBlocks={ savePost }
							/>
							<div
								className="edit-navigation-layout__canvas"
								ref={ canvasRef }
							>
								<Editor
									isPending={ ! navigationPost }
									blocks={ blocks }
								/>
							</div>
							<InspectorAdditions
								menuId={ selectedMenuId }
								onDeleteMenu={ deleteMenu }
							/>
						</BlockEditorProvider>

						<BlockInspector bubblesVirtually={ false } />
					</div>

					<Popover.Slot />
				</DropZoneProvider>
			</SlotFillProvider>
		</ErrorBoundary>
	);
}
