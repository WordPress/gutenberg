/**
 * Internal dependencies
 */
import NavigationMenuItem from './menu-item';

const NavigationMenu = ( { activeId, children, items, onSelect } ) => {
	return (
		<ul className="components-navigation__menu">
			{ children }
			{ items.map( ( item ) => (
				<NavigationMenuItem
					hasChildren={ item.children.length > 0 }
					isActive={ item.id === activeId }
					key={ item.id }
					onClick={ () =>
						item.children.length
							? onSelect( item.children[ 0 ] )
							: onSelect( item )
					}
				>
					{ item.title }
				</NavigationMenuItem>
			) ) }
		</ul>
	);
};

export default NavigationMenu;
