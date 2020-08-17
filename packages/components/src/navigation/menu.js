/**
 * Internal dependencies
 */
import { MenuUI } from './styles/navigation-styles';

const NavigationMenu = ( { children } ) => {
	return (
		<MenuUI className="components-navigation__menu">{ children }</MenuUI>
	);
};

export default NavigationMenu;
