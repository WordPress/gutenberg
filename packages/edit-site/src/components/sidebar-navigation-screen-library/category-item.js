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
	const linkInfo = useLink(
		{
			path: '/library',
			categoryType: type,
			categoryId: id,
		},
		{
			// Keep record for where we came from in a state so we can
			// use browser's back button to go back to the library.
			// See the implementation of the back button in patterns-list.
			backPath: '/library',
		}
	);

	if ( ! count ) {
		return;
	}

	return (
		<SidebarNavigationItem
			{ ...linkInfo }
			icon={ icon }
			suffix={ <span>{ count }</span> }
			className={ isActive ? 'is-active-category' : undefined }
		>
			{ label }
		</SidebarNavigationItem>
	);
}
