/**
 * Internal dependencies
 */
import { ItemBadgeUI, ItemTitleUI } from '../styles/navigation-styles';

import type { NavigationItemBaseContentProps } from '../types';

export default function NavigationItemBaseContent(
	props: NavigationItemBaseContentProps
) {
	const { badge, title } = props;

	return (
		<>
			{ title && (
				<ItemTitleUI
					className="components-navigation__item-title"
					as="span"
				>
					{ title }
				</ItemTitleUI>
			) }

			{ badge && (
				<ItemBadgeUI className="components-navigation__item-badge">
					{ badge }
				</ItemBadgeUI>
			) }
		</>
	);
}
