/**
 * WordPress dependencies
 */
import { Children, cloneElement } from '@wordpress/element';

const Navigation = ( { active, children, items } ) => {
	const activeItem = items.find( ( item ) => item.id === active );
	const parentItem = items.find( ( item ) => item.id === activeItem.parent );
	const grandParentItem =
		parentItem && parentItem.parent
			? items.find( ( item ) => item.id === parentItem.parent )
			: null;
	const backItem = parentItem
		? items.find( ( item ) => {
				if ( grandParentItem ) {
					return item.parent === grandParentItem;
				}
				return ! item.parent;
		  } )
		: null;

	return (
		<div className="components-navigation">
			{ Children.map( children, ( child ) =>
				child
					? cloneElement( child, {
							active,
							backItem,
							items,
							parentItem,
					  } )
					: null
			) }
		</div>
	);
};

export default Navigation;
