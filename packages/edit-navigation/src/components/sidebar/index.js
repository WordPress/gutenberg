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

/**
 * Internal dependencies
 */
import MenuSettings from './menu-settings';
import ManageLocations from './manage-locations';
import DeleteMenu from './delete-menu';
import {
	SIDEBAR_BLOCK,
	SIDEBAR_NAVIGATION,
	SIDEBAR_SCOPE,
} from '../../constants';

export default function Sidebar( {
	menuId,
	menus,
	isMenuBeingDeleted,
	onDeleteMenu,
	onSelectMenu,
	isManageLocationsModalOpen,
	closeManageLocationsModal,
	openManageLocationsModal,
	hasPermanentSidebar,
} ) {
	const { sidebarName, hasBlockSelection, hasSidebarEnabled } = useSelect(
		( select ) => {
			const sidebar = select( interfaceStore ).getActiveComplementaryArea(
				SIDEBAR_SCOPE
			);
			const blockSelection = select(
				blockEditorStore
			).getBlockSelectionStart();

			return {
				sidebarName: blockSelection
					? SIDEBAR_BLOCK
					: SIDEBAR_NAVIGATION,
				hasBlockSelection: blockSelection,
				hasSidebarEnabled: [
					SIDEBAR_NAVIGATION,
					SIDEBAR_BLOCK,
				].includes( sidebar ),
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
			enableComplementaryArea( SIDEBAR_SCOPE, SIDEBAR_NAVIGATION );
		}
	}, [ hasBlockSelection, hasSidebarEnabled ] );

	return (
		<ComplementaryArea
			className="edit-navigation-sidebar"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Settings' ) }
			closeLabel={ __( 'Close settings' ) }
			scope={ SIDEBAR_SCOPE }
			identifier={ sidebarName }
			icon={ cog }
			isActiveByDefault={ hasPermanentSidebar }
			header={ <></> }
			isPinnable={ ! hasPermanentSidebar }
		>
			{ sidebarName === SIDEBAR_NAVIGATION && (
				<>
					<MenuSettings menuId={ menuId } />
					<ManageLocations
						menus={ menus }
						selectedMenuId={ menuId }
						onSelectMenu={ onSelectMenu }
						isModalOpen={ isManageLocationsModalOpen }
						closeModal={ closeManageLocationsModal }
						openModal={ openManageLocationsModal }
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
