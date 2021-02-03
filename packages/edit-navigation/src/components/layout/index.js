/**
 * WordPress dependencies
 */
import {
	DropZoneProvider,
	Popover,
	SlotFillProvider,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
} from '@wordpress/block-editor';
import {
	InterfaceSkeleton,
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useNavigationEditor from './use-navigation-editor';
import useNavigationBlockEditor from './use-navigation-block-editor';
import useMenuNotifications from './use-menu-notifications';
import ErrorBoundary from '../error-boundary';
import NavigationEditorShortcuts from './shortcuts';
import Sidebar from './sidebar';
import Header from '../header';
import Notices from '../notices';
import Toolbar from '../toolbar';
import Editor from '../editor';
import InspectorAdditions from '../inspector-additions';
import { store as editNavigationStore } from '../../store';

const interfaceLabels = {
	/* translators: accessibility text for the navigation screen top bar landmark region. */
	header: __( 'Navigation top bar' ),
	/* translators: accessibility text for the navigation screen content landmark region. */
	body: __( 'Menu blocks' ),
	/* translators: accessibility text for the widgets screen settings landmark region. */
	sidebar: __( 'Navigation settings' ),
};

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

	const { hasSidebarEnabled } = useSelect( ( select ) => ( {
		hasSidebarEnabled: !! select(
			interfaceStore
		).getActiveComplementaryArea( 'core/edit-navigation' ),
	} ) );

	useMenuNotifications( selectedMenuId );

	return (
		<ErrorBoundary>
			<SlotFillProvider>
				<DropZoneProvider>
					<BlockEditorKeyboardShortcuts.Register />
					<NavigationEditorShortcuts.Register />

					<Notices />
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
						<NavigationEditorShortcuts saveBlocks={ savePost } />
						<InterfaceSkeleton
							labels={ interfaceLabels }
							header={
								<Header
									isPending={ ! navigationPost }
									menus={ menus }
									selectedMenuId={ selectedMenuId }
									onSelectMenu={ selectMenu }
									navigationPost={ navigationPost }
								/>
							}
							content={
								<>
									<div className="edit-navigation-layout">
										<div className="navigation-editor-canvas">
											<Toolbar
												isPending={ ! navigationPost }
												navigationPost={
													navigationPost
												}
											/>
											<Editor
												isPending={ ! navigationPost }
												blocks={ blocks }
											/>
										</div>
									</div>
									<InspectorAdditions
										menuId={ selectedMenuId }
										onDeleteMenu={ deleteMenu }
									/>
								</>
							}
							sidebar={
								hasSidebarEnabled && (
									<ComplementaryArea.Slot scope="core/edit-navigation" />
								)
							}
						/>
						<Sidebar />
					</BlockEditorProvider>
					<Popover.Slot />
				</DropZoneProvider>
			</SlotFillProvider>
		</ErrorBoundary>
	);
}
