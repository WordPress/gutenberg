/**
 * Internal dependencies
 */
import { MenuUI, MenuTitleUI } from './styles/navigation-styles';

const NavigationMenu = ( { children, title } ) => {
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
