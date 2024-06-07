/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLink } from '../routes/link';
import {
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_PART_ALL_AREAS_CATEGORY,
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_TYPES,
} from '../../utils/constants';

export default function CategoryItem( {
	count,
	icon,
	id,
	isActive,
	label,
	type,
} ) {
	const linkInfo = useLink( {
		categoryId:
			id !== TEMPLATE_PART_ALL_AREAS_CATEGORY &&
			id !== PATTERN_DEFAULT_CATEGORY
				? id
				: undefined,
		postType:
			type === TEMPLATE_PART_POST_TYPE
				? TEMPLATE_PART_POST_TYPE
				: PATTERN_TYPES.user,
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
