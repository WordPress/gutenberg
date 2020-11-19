/**
 * Internal dependencies
 */
import { useRTL } from '../../utils';
import { ItemBadgeUI, ItemTitleUI } from '../styles/navigation-styles';

export default function NavigationItemBaseContent( props ) {
	const { badge, title } = props;
	const isRTL = useRTL();

	return (
		<>
			{ title && (
				<ItemTitleUI
					className="components-navigation__item-title"
					variant="body.small"
					isRTL={ isRTL }
					as="span"
				>
					{ title }
				</ItemTitleUI>
			) }

			{ badge && (
				<ItemBadgeUI
					className="components-navigation__item-badge"
					isRTL={ isRTL }
				>
					{ badge }
				</ItemBadgeUI>
			) }
		</>
	);
}
