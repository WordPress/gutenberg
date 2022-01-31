/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { cog } from '@wordpress/icons';
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockInspector,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SidebarHeader from './sidebar-header';
import MenuSettings from './menu-settings';
import ManageLocations from './manage-locations';
import DeleteMenu from './delete-menu';
import { SIDEBAR_BLOCK, SIDEBAR_MENU, SIDEBAR_SCOPE } from '../../constants';

export default function Sidebar( {
	menuId,
	menus,
	isMenuBeingDeleted,
	onDeleteMenu,
	onSelectMenu,
} ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const { sidebar, hasBlockSelection, hasSidebarEnabled } = useSelect(
		( select ) => {
			const _sidebar = select(
				interfaceStore
			).getActiveComplementaryArea( SIDEBAR_SCOPE );

			const _hasSidebarEnabled = [ SIDEBAR_MENU, SIDEBAR_BLOCK ].includes(
				_sidebar
			);

			return {
				sidebar: _sidebar,
				hasBlockSelection: !! select(
					blockEditorStore
				).getBlockSelectionStart(),
				hasSidebarEnabled: _hasSidebarEnabled,
			};
		},
		[]
	);
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	useEffect( () => {
		if ( ! hasSidebarEnabled ) {
			return;
		}

		if ( hasBlockSelection ) {
			enableComplementaryArea( SIDEBAR_SCOPE, SIDEBAR_BLOCK );
		} else {
			enableComplementaryArea( SIDEBAR_SCOPE, SIDEBAR_MENU );
		}
	}, [ hasBlockSelection, hasSidebarEnabled ] );

	let sidebarName = sidebar;
	if ( ! hasSidebarEnabled ) {
		sidebarName = hasBlockSelection ? SIDEBAR_BLOCK : SIDEBAR_MENU;
	}

	return (
		<ComplementaryArea
			className="edit-navigation-sidebar"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Settings' ) }
			closeLabel={ __( 'Close settings' ) }
			scope={ SIDEBAR_SCOPE }
			identifier={ sidebarName }
			icon={ cog }
			isActiveByDefault={ isLargeViewport }
			header={ <SidebarHeader sidebarName={ sidebarName } /> }
			headerClassName="edit-navigation-sidebar__panel-tabs"
			isPinnable
			hideToggleToScreenReader="true"
		>
			{ sidebarName === SIDEBAR_MENU && (
				<>
					<MenuSettings menuId={ menuId } />
					<ManageLocations
						menus={ menus }
						selectedMenuId={ menuId }
						onSelectMenu={ onSelectMenu }
					/>
					<DeleteMenu
						onDeleteMenu={ onDeleteMenu }
						isMenuBeingDeleted={ isMenuBeingDeleted }
					/>
				</>
			) }
			{ sidebarName === SIDEBAR_BLOCK && <BlockInspector /> }
		</ComplementaryArea>
	);
}
