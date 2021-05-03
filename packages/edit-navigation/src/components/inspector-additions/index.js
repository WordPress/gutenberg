/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import AutoAddPages from './auto-add-pages';
import DeleteMenu from './delete-menu';
import ManageLocations from './manage-locations';
import { NameEditor } from '../name-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function InspectorAdditions( {
	menuId,
	menus,
	isMenuBeingDeleted,
	onDeleteMenu,
	onSelectMenu,
	isManageLocationsModalOpen,
	closeManageLocationsModal,
	openManageLocationsModal,
} ) {
	const selectedBlock = useSelect(
		( select ) => select( 'core/block-editor' ).getSelectedBlock(),
		[]
	);

	if ( selectedBlock?.name !== 'core/navigation' ) {
		return null;
	}

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Menu settings' ) }>
				<NameEditor />
				<AutoAddPages menuId={ menuId } />
				<DeleteMenu
					onDeleteMenu={ onDeleteMenu }
					isMenuBeingDeleted={ isMenuBeingDeleted }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Theme locations' ) }>
				<ManageLocations
					menus={ menus }
					selectedMenuId={ menuId }
					onSelectMenu={ onSelectMenu }
					isModalOpen={ isManageLocationsModalOpen }
					closeModal={ closeManageLocationsModal }
					openModal={ openManageLocationsModal }
				/>
			</PanelBody>
		</InspectorControls>
	);
}
