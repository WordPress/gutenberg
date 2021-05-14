/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { PinnedItems } from '@wordpress/interface';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SaveButton from './save-button';
import MenuSwitcher from '../menu-switcher';
import { useMenuEntityProp } from '../../hooks';

export default function Header( {
	isMenuSelected,
	menus,
	selectedMenuId,
	onSelectMenu,
	isPending,
	navigationPost,
} ) {
	const [ menuName ] = useMenuEntityProp( 'name', selectedMenuId );
	let actionHeaderText;

	if ( menuName ) {
		actionHeaderText = sprintf(
			// translators: Name of the menu being edited, e.g. 'Main Menu'.
			__( 'Editing: %s' ),
			menuName
		);
	} else if ( isPending ) {
		// Loading text won't be displayed if menus are preloaded.
		actionHeaderText = __( 'Loading …' );
	} else {
		actionHeaderText = __( 'No menus available' );
	}

	return (
		<div className="edit-navigation-header">
			<div className="edit-navigation-header__title-subtitle">
				<h1 className="edit-navigation-header__title">
					{ __( 'Navigation' ) }
				</h1>
				<h2 className="edit-navigation-header__subtitle">
					{ isMenuSelected && actionHeaderText }
				</h2>
			</div>
			{ isMenuSelected && (
				<div className="edit-navigation-header__actions">
					<DropdownMenu
						icon={ null }
						toggleProps={ {
							children: __( 'Switch menu' ),
							'aria-label': __(
								'Switch menu, or create a new menu'
							),
							showTooltip: false,
							isTertiary: true,
							disabled: ! menus?.length,
							__experimentalIsFocusable: true,
						} }
						popoverProps={ {
							className:
								'edit-navigation-header__menu-switcher-dropdown',
							position: 'bottom center',
						} }
					>
						{ ( { onClose } ) => (
							<MenuSwitcher
								menus={ menus }
								selectedMenuId={ selectedMenuId }
								onSelectMenu={ ( menuId ) => {
									onSelectMenu( menuId );
									onClose();
								} }
							/>
						) }
					</DropdownMenu>

					<SaveButton navigationPost={ navigationPost } />
					<PinnedItems.Slot scope="core/edit-navigation" />
				</div>
			) }
		</div>
	);
}
