import SidebarNavigationItem from '../sidebar-navigation-item';
import { TEMPLATE_PART_POST_TYPE } from '../../utils/constants';

export default function CategoryItem( {
	count,
	icon,
	id,
	isActive,
	label,
	type,
} ) {
	if (
		count === undefined ||
		( ! count && type === TEMPLATE_PART_POST_TYPE )
	) {
		return;
	}
	const queryArgs = [ `postType=${ type }` ];
	if ( id ) {
		queryArgs.push( `categoryId=${ id }` );
	}

	return (
		<SidebarNavigationItem
			icon={ icon }
			suffix={ <span>{ count }</span> }
			aria-current={ isActive ? 'true' : undefined }
			to={ `/pattern?${ queryArgs.join( '&' ) }` }
		>
			{ label }
		</SidebarNavigationItem>
	);
}
