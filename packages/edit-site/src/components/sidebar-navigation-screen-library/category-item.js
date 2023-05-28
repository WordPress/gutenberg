/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLink } from '../routes/link';

export default function CategoryItem( { count, icon, label, name, type } ) {
	const linkInfo = useLink( {
		path: '/library',
		categoryType: type,
		categoryName: name,
	} );

	if ( ! count ) {
		return;
	}

	return (
		<SidebarNavigationItem
			{ ...linkInfo }
			icon={ icon }
			suffix={ <span>{ count }</span> }
		>
			{ label }
		</SidebarNavigationItem>
	);
}
