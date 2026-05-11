/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';

export default function CategoryItem( {
	count,
	icon,
	id,
	isActive,
	label,
	type,
} ) {
	if ( ! count ) {
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
