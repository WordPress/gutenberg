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
} from '@wordpress/block-editor';

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
import Toolbar from '../toolbar';
import Editor from '../editor';
import InspectorAdditions from '../inspector-additions';
import { store as editNavigationStore } from '../../store';

export default function Layout( { blockEditorSettings } ) {
	const { saveNavigationPost } = useDispatch( editNavigationStore );
	const savePost = () => saveNavigationPost( navigationPost );

	const {
		menus,
		selectedMenuId,
		navigationPost,
		selectMenu,
		deleteMenu,
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
							isPending={ ! navigationPost }
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
								hasFixedToolbar: true,
							} }
							useSubRegistry={ false }
						>
							<BlockEditorKeyboardShortcuts />
							<NavigationEditorShortcuts
								saveBlocks={ savePost }
							/>
							<div className="navigation-editor-canvas">
								<Toolbar
									isPending={ ! navigationPost }
									navigationPost={ navigationPost }
								/>
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
