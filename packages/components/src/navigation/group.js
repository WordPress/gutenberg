/**
 * Internal dependencies
 */
import { MenuGroupTitleUI } from './styles/navigation-styles';

export default function NavigationGroup( { children, title } ) {
	return (
		<div className="components-navigation__menu-group">
			{ title && (
				<MenuGroupTitleUI
					as="h3"
					className="components-navigation__menu-group-title"
					variant="caption"
				>
					{ title }
				</MenuGroupTitleUI>
			) }
			<ul>{ children }</ul>
		</div>
	);
}
