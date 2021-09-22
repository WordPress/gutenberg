/**
 * WordPress dependencies
 */
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockTools,
	__unstableUseBlockSelectionClearer as useBlockSelectionClearer,
} from '@wordpress/block-editor';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { Popover, SlotFillProvider, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import {
	InterfaceSkeleton,
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import UnselectedMenuState from './unselected-menu-state';
import {
	IsMenuNameControlFocusedContext,
	useNavigationEditor,
	useMenuNotifications,
} from '../../hooks';
import ErrorBoundary from '../error-boundary';
import NavigationEditorShortcuts from './shortcuts';
import Sidebar from '../sidebar';
import Header from '../header';
import Notices from '../notices';
import Editor from '../editor';
import InserterSidebar from '../inserter-sidebar';
import UnsavedChangesWarning from './unsaved-changes-warning';
import { store as editNavigationStore } from '../../store';
import {
	NAVIGATION_POST_KIND,
	NAVIGATION_POST_POST_TYPE,
} from '../../constants';

const interfaceLabels = {
	/* translators: accessibility text for the navigation screen top bar landmark region. */
	header: __( 'Navigation top bar' ),
	/* translators: accessibility text for the navigation screen content landmark region. */
	body: __( 'Navigation menu blocks' ),
	/* translators: accessibility text for the navigation screen settings landmark region. */
	sidebar: __( 'Navigation settings' ),
	secondarySidebar: __( 'Block library' ),
};

export default function Layout( { blockEditorSettings } ) {
	const contentAreaRef = useBlockSelectionClearer();
	const [ isMenuNameControlFocused, setIsMenuNameControlFocused ] = useState(
		false
	);
	const { saveNavigationPost } = useDispatch( editNavigationStore );
	const savePost = () => saveNavigationPost( navigationPost );

	const {
		menus,
		hasLoadedMenus,
		hasFinishedInitialLoad,
		selectedMenuId,
		navigationPost,
		isMenuBeingDeleted,
		selectMenu,
		deleteMenu,
		isMenuSelected,
	} = useNavigationEditor();

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		NAVIGATION_POST_KIND,
		NAVIGATION_POST_POST_TYPE,
		{
			id: navigationPost?.id,
		}
	);

	const { hasSidebarEnabled, isInserterOpened } = useSelect(
		( select ) => ( {
			hasSidebarEnabled: !! select(
				interfaceStore
			).getActiveComplementaryArea( 'core/edit-navigation' ),
			isInserterOpened: select( editNavigationStore ).isInserterOpened(),
		} ),
		[]
	);

	useEffect( () => {
		if ( ! selectedMenuId && menus?.length ) {
			selectMenu( menus[ 0 ].id );
		}
	}, [ selectedMenuId, menus ] );

	useMenuNotifications( selectedMenuId );

	const hasMenus = !! menus?.length;

	const isBlockEditorReady = !! (
		hasMenus &&
		navigationPost &&
		isMenuSelected
	);

	return (
		<ErrorBoundary>
			<ShortcutProvider>
				<div
					hidden={ ! isMenuBeingDeleted }
					className={ 'edit-navigation-layout__overlay' }
				/>
				<SlotFillProvider>
					<BlockEditorKeyboardShortcuts.Register />
					<NavigationEditorShortcuts.Register />
					<NavigationEditorShortcuts saveBlocks={ savePost } />
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
						<IsMenuNameControlFocusedContext.Provider
							value={ useMemo(
								() => [
									isMenuNameControlFocused,
									setIsMenuNameControlFocused,
								],
								[ isMenuNameControlFocused ]
							) }
						>
							<InterfaceSkeleton
								className="edit-navigation-layout"
								labels={ interfaceLabels }
								header={
									<Header
										isMenuSelected={ isMenuSelected }
										isPending={ ! hasLoadedMenus }
										menus={ menus }
										navigationPost={ navigationPost }
									/>
								}
								content={
									<>
										<Notices />
										{ ! hasFinishedInitialLoad && (
											<Spinner />
										) }

										{ ! isMenuSelected &&
											hasFinishedInitialLoad && (
												<UnselectedMenuState
													onSelectMenu={ selectMenu }
													onCreate={ selectMenu }
													menus={ menus }
												/>
											) }
										{ isBlockEditorReady && (
											<div
												className="edit-navigation-layout__content-area"
												ref={ contentAreaRef }
											>
												<BlockTools>
													<Editor
														isPending={
															! hasLoadedMenus
														}
													/>
												</BlockTools>
											</div>
										) }
									</>
								}
								sidebar={
									hasSidebarEnabled && (
										<ComplementaryArea.Slot scope="core/edit-navigation" />
									)
								}
								secondarySidebar={
									isInserterOpened && <InserterSidebar />
								}
							/>
							{ isMenuSelected && (
								<Sidebar
									menus={ menus }
									menuId={ selectedMenuId }
									onSelectMenu={ selectMenu }
									onDeleteMenu={ deleteMenu }
									isMenuBeingDeleted={ isMenuBeingDeleted }
								/>
							) }
						</IsMenuNameControlFocusedContext.Provider>
						<UnsavedChangesWarning />
					</BlockEditorProvider>
					<Popover.Slot />
				</SlotFillProvider>
			</ShortcutProvider>
		</ErrorBoundary>
	);
}
