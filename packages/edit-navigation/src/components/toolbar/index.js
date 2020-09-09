/**
 * WordPress dependencies
 */
import { Spinner, SelectControl, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BlockToolbar } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SaveButton from './save-button';
import BlockInspectorDropdown from './block-inspector-dropdown';
import AddMenuForm from './add-menu-form';

export default function Toolbar( {
	menus,
	selectedMenuId,
	isAddingMenu,
	onSelectMenu,
	onCancelAddingMenu,
} ) {
	const hasSelectedMenu = !! menus && !! selectedMenuId;

	return (
		<div className="edit-navigation-toolbar">
			{ hasSelectedMenu || isAddingMenu ? (
				<>
					{ hasSelectedMenu && (
						<SelectControl
							className="edit-navigation-toolbar__menu-select"
							label={ __( 'Currently editing' ) }
							hideLabelFromVision
							value={ selectedMenuId }
							options={ menus.map( ( menu ) => ( {
								label: menu.name,
								value: menu.id,
							} ) ) }
							onChange={ onSelectMenu }
						/>
					) }

					{ ! isAddingMenu && (
						<>
							<BlockToolbar __experimentalExpandedControl />
							<Popover.Slot name="block-toolbar" />
							<SaveButton menuId={ selectedMenuId } />
							<BlockInspectorDropdown />
						</>
					) }

					{ isAddingMenu && (
						<AddMenuForm
							menus={ menus }
							onCancel={ onCancelAddingMenu }
							onCreate={ onSelectMenu }
						/>
					) }
				</>
			) : (
				<Spinner />
			) }
		</div>
	);
}
