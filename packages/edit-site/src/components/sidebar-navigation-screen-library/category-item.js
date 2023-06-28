/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLink } from '../routes/link';

/**
 * WordPress dependencies
 */
import { sprintf, _n } from '@wordpress/i18n';

export default function CategoryItem( {
	count,
	icon,
	id,
	isActive,
	label,
	type,
	typeLabel,
} ) {
	const linkInfo = useLink(
		{
			path: '/library',
			categoryType: type,
			categoryId: id,
		},
		{
			// Keep a record of where we came from in state so we can
			// use the browser's back button to go back to the library.
			// See the implementation of the back button in patterns-list.
			backPath: '/library',
		}
	);

	if ( ! count ) {
		return;
	}

	const ariaLabel = sprintf(
		/* translators: %1$s is the category name, %2$s is the type (pattern or template part), %3$s is the number of items. */
		_n( '%1$s (%2$s), %3$s item', '%1$s (%2$s), %3$s items', count ),
		label,
		typeLabel ? typeLabel : type,
		count
	);

	return (
		<SidebarNavigationItem
			{ ...linkInfo }
			icon={ icon }
			suffix={ <span>{ count }</span> }
			aria-current={ isActive ? 'true' : undefined }
			aria-label={ ariaLabel }
		>
			{ label }
		</SidebarNavigationItem>
	);
}
