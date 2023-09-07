/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLink } from '../routes/link';

export default function CategoryItem( {
	count,
	icon,
	id,
	isActive,
	label,
	type,
} ) {
	const linkInfo = useLink( {
		path: '/patterns',
		categoryType: type,
		categoryId: id,
	} );

	if ( ! count ) {
		return;
	}

	return (
		<SidebarNavigationItem
			{ ...linkInfo }
			icon={ icon }
			suffix={ <span>{ count }</span> }
			aria-current={ isActive ? 'true' : undefined }
		>
			{ label }
		</SidebarNavigationItem>
	);
}
