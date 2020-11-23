/**
 * WordPress dependencies
 */
import {
	DropZoneProvider,
	FocusReturnProvider,
	Popover,
	SlotFillProvider,
} from '@wordpress/components';
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
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

export default function Layout( { blockEditorSettings } ) {
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
					<FocusReturnProvider>
						<BlockEditorKeyboardShortcuts.Register />
						<NavigationEditorShortcuts.Register />

						<Notices />

						<div className="edit-navigation-layout">
							<Header
								isPending={ ! navigationPost }
								menus={ menus }
								selectedMenuId={ selectedMenuId }
								onSelectMenu={ selectMenu }
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
							>
								<Toolbar
									isPending={ ! navigationPost }
									navigationPost={ navigationPost }
								/>
								<Editor
									isPending={ ! navigationPost }
									blocks={ blocks }
								/>
								<InspectorAdditions
									menuId={ selectedMenuId }
									onDeleteMenu={ deleteMenu }
								/>
							</BlockEditorProvider>
						</div>

						<Popover.Slot />
					</FocusReturnProvider>
				</DropZoneProvider>
			</SlotFillProvider>
		</ErrorBoundary>
	);
}
