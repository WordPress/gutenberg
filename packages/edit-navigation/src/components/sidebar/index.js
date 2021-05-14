/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
import { cog } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MenuSettings from './menu-settings';
import ManageLocations from './manage-locations';
import DeleteMenu from './delete-menu';
import {
	COMPLEMENTARY_AREA_SCOPE,
	COMPLEMENTARY_AREA_ID,
} from '../../constants';

function useTogglePermanentSidebar( hasPermanentSidebar ) {
	const { enableComplementaryArea, disableComplementaryArea } = useDispatch(
		interfaceStore
	);

	useEffect( () => {
		if ( hasPermanentSidebar ) {
			enableComplementaryArea(
				COMPLEMENTARY_AREA_SCOPE,
				COMPLEMENTARY_AREA_ID
			);
		} else {
			disableComplementaryArea(
				COMPLEMENTARY_AREA_SCOPE,
				COMPLEMENTARY_AREA_ID
			);
		}
	}, [
		hasPermanentSidebar,
		enableComplementaryArea,
		disableComplementaryArea,
	] );
}

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
	const { isGeneralNavigation } = useSelect( ( select ) => {
		const selectedBlock = select( blockEditorStore ).getSelectedBlock();

		return {
			isGeneralNavigation: selectedBlock?.name !== 'core/navigation-link',
		};
	}, [] );

	useTogglePermanentSidebar( hasPermanentSidebar );

	return (
		<ComplementaryArea
			className="edit-navigation-sidebar"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Settings' ) }
			closeLabel={ __( 'Close settings' ) }
			scope={ COMPLEMENTARY_AREA_SCOPE }
			identifier={ COMPLEMENTARY_AREA_ID }
			icon={ cog }
			isActiveByDefault={ hasPermanentSidebar }
			header={ <></> }
			isPinnable={ ! hasPermanentSidebar }
		>
			{ isGeneralNavigation ? (
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
			) : (
				<BlockInspector />
			) }
		</ComplementaryArea>
	);
}
