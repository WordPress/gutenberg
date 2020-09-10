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
	return (
		<div className="edit-navigation-toolbar">
			{ menus ? (
				<>
					<SelectControl
						className="edit-navigation-toolbar__menu-select"
						label={ __( 'Currently editing' ) }
						hideLabelFromVision
						disabled={ ! menus.length }
						value={ selectedMenuId ?? 0 }
						options={
							menus.length
								? menus.map( ( menu ) => ( {
										value: menu.id,
										label: menu.name,
								  } ) )
								: [
										{
											value: 0,
											label: __(
												'— Select navigation —'
											),
										},
								  ]
						}
						onChange={ onSelectMenu }
					/>

					{ isAddingMenu ? (
						<AddMenuForm
							menus={ menus }
							onCancel={ onCancelAddingMenu }
							onCreate={ onSelectMenu }
						/>
					) : (
						<>
							<BlockToolbar __experimentalExpandedControl />
							<Popover.Slot name="block-toolbar" />
							<SaveButton menuId={ selectedMenuId } />
							<BlockInspectorDropdown />
						</>
					) }
				</>
			) : (
				<Spinner />
			) }
		</div>
	);
}
