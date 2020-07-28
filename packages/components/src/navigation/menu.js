/**
 * Internal dependencies
 */
import NavigationMenuItem from './menu-item';

const NavigationMenu = ( { active, id, items, parentItem } ) => {
	const menuItems = items.filter( ( item ) => {
		if ( ! id ) {
			return ! item.menu;
		}
		return item.menu === id;
	} );
	const visibleItems = menuItems.filter( ( item ) => {
		if ( ! parentItem ) {
			return ! item.parent;
		}
		return item.parent === parentItem.id;
	} );

	const getChildren = ( item ) => {
		return menuItems.filter( ( i ) => i.parent === item.id );
	};

	return (
		<div className="components-navigation__menu-items">
			{ visibleItems.map( ( item ) => {
				const children = getChildren( item );
				return (
					<NavigationMenuItem
						hasChildren={ children.length }
						id={ item.id }
						isActive={ item.id === active }
						key={ item.id }
						onClick={ () => {
							if ( children.length ) {
								children[ 0 ].onClick();
								return;
							}
							item.onClick();
						} }
						parent={ item.parent }
					>
						{ item.title }
					</NavigationMenuItem>
				);
			} ) }
		</div>
	);
};

export default NavigationMenu;
