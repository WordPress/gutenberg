/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

const ExistingMenusOptions = ( {
	showNavigationMenus,
	showClassicMenus = false,
	navigationMenus,
	classicMenus,
	onSelectNavigationMenu,
	onSelectClassicMenu,
	actionLabel,
} ) => {
	const hasNavigationMenus = !! navigationMenus?.length;
	const hasClassicMenus = !! classicMenus?.length;

	/* translators: %s: The name of a menu. */
	const createActionLabel = __( "Create from '%s'" );

	actionLabel = actionLabel || createActionLabel;

	return (
		<>
			{ showNavigationMenus && hasNavigationMenus && (
				<MenuGroup label={ __( 'Menus' ) }>
					{ navigationMenus.map( ( menu ) => {
						const label = decodeEntities( menu.title.rendered );
						return (
							<MenuItem
								onClick={ () => {
									onSelectNavigationMenu( menu );
								} }
								key={ menu.id }
								aria-label={ sprintf( actionLabel, label ) }
							>
								{ label }
							</MenuItem>
						);
					} ) }
				</MenuGroup>
			) }
			{ showClassicMenus && hasClassicMenus && (
				<MenuGroup label={ __( 'Classic Menus' ) }>
					{ classicMenus.map( ( menu ) => {
						const label = decodeEntities( menu.name );
						return (
							<MenuItem
								onClick={ () => {
									onSelectClassicMenu( menu );
								} }
								key={ menu.id }
								aria-label={ sprintf(
									createActionLabel,
									label
								) }
							>
								{ label }
							</MenuItem>
						);
					} ) }
				</MenuGroup>
			) }
		</>
	);
};

export default ExistingMenusOptions;
