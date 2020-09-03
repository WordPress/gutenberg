/**
 * Internal dependencies
 */
import { MenuUI, MenuTitleUI } from './styles/navigation-styles';

const NavigationMenu = ( { children, title } ) => {
	if ( ! children.length ) {
		return null;
	}

	return (
		<MenuUI className="components-navigation__menu">
			{ title && (
				<MenuTitleUI
					variant="subtitle"
					className="components-navigation__menu-title"
				>
					{ title }
				</MenuTitleUI>
			) }
			<ul>{ children }</ul>
		</MenuUI>
	);
};

export default NavigationMenu;
