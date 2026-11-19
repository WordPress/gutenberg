import { Warning } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import NavigationMenuSelector from './navigation-menu-selector';

const CHOOSE_TOGGLE_PROPS = {
	variant: 'secondary',
	__next40pxDefaultSize: true,
};

/**
 * Shown in place of a Navigation block that has been told to show no menu
 * (`noFallback`), so it doesn't quietly fall back to the site's newest menu.
 * Choosing a menu, or creating one, ends that state.
 *
 * @param props
 * @param props.currentMenuId          The chosen menu, if any.
 * @param props.onSelectNavigationMenu Called with a menu's ID.
 * @param props.onSelectClassicMenu    Called with a classic menu.
 * @param props.onCreateNew            Creates an empty menu.
 */
export default function NoMenuWarning( {
	currentMenuId,
	onSelectNavigationMenu,
	onSelectClassicMenu,
	onCreateNew,
}: {
	currentMenuId?: number;
	onSelectNavigationMenu: ( menuId: number ) => void;
	onSelectClassicMenu: ( menu: unknown ) => void;
	onCreateNew: () => void;
} ) {
	return (
		<Warning
			actions={ [
				<NavigationMenuSelector
					key="choose"
					currentMenuId={ currentMenuId }
					onSelectNavigationMenu={ onSelectNavigationMenu }
					onSelectClassicMenu={ onSelectClassicMenu }
					onCreateNew={ onCreateNew }
					icon={ null }
					text={ __( 'Choose a menu' ) }
					toggleProps={ CHOOSE_TOGGLE_PROPS }
				/>,
			] }
		>
			{ __( 'No menu is assigned to this block.' ) }
		</Warning>
	);
}
