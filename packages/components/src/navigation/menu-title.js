/**
 * Internal dependencies
 */
import { MenuTitleUI } from './styles/navigation-styles';

export default function NavigationMenuTitle( { title } ) {
	if ( ! title ) {
		return;
	}

	return (
		<MenuTitleUI
			as="h2"
			className="components-navigation__menu-title"
			variant="subtitle"
		>
			{ title }
		</MenuTitleUI>
	);
}
