/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ItemBadgeUI, ItemTitleUI } from '../styles/navigation-styles';

export default function NavigationItemBaseContent( props ) {
	const { badge, title, icon } = props;

	return (
		<>
			{ icon && <Icon icon={ icon } /> }

			{ title && (
				<ItemTitleUI
					className="components-navigation__item-title"
					variant="body.small"
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
