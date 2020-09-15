/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import {
	DropZoneProvider,
	__experimentalEditInPlaceControl as EditInPlaceControl,
	Popover,
	SlotFillProvider,
	ToolbarGroup,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockControls,
} from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';

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

const withMenuName = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		return (
			<>
				<BlockEdit { ...props } />
				<BlockControls>
					<ToolbarGroup>
						<EditInPlaceControl label="Sample menu" />
					</ToolbarGroup>
				</BlockControls>
			</>
		);
	},
	'withMenuName'
);

addFilter(
	'navigation.BlockEdit',
	'core/edit-navigation/with-menu-name',
	withMenuName
);

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
				</DropZoneProvider>
			</SlotFillProvider>
		</ErrorBoundary>
	);
}
