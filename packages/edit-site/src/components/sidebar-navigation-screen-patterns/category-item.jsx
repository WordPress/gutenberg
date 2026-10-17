import SidebarNavigationItem from '../sidebar-navigation-item';

export default function CategoryItem( {
	count,
	icon,
	id,
	isActive,
	isUserCategory = false,
	label,
	type,
} ) {
	// User-created categories stay listed even with no patterns, so they can be
	// opened, renamed, or deleted. Everything else keeps hiding at zero.
	if ( ! count && ! isUserCategory ) {
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
