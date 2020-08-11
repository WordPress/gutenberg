/**
 * Internal dependencies
 */
import { Menu } from './styles/navigation-styles';

const NavigationMenu = ( { children } ) => {
	return <Menu className="components-navigation__menu">{ children }</Menu>;
};

export default NavigationMenu;
