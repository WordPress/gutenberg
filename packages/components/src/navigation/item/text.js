/**
 * Internal dependencies
 */
import { ItemBaseUI } from '../styles/navigation-styles';
import { useRTL } from '../../utils/rtl';
import NavigationItemBaseContent from './base-content';
import NavigationItemBase from './base';

export default function NavigationItemText( props ) {
	const { badge, title, children } = props;
	const isRTL = useRTL();

	return (
		<NavigationItemBase { ...props }>
			{ children || (
				<ItemBaseUI>
					<NavigationItemBaseContent
						title={ title }
						badge={ badge }
						isRTL={ isRTL }
					/>
				</ItemBaseUI>
			) }
		</NavigationItemBase>
	);
}
