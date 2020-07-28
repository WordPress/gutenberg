/**
 * WordPress dependencies
 */
import { Children, cloneElement } from '@wordpress/element';

const Navigation = ( { active, children, items } ) => {
	const activeItem = items.find( ( item ) => item.id === active );
	const parentItem = items.find( ( item ) => item.id === activeItem.parent );

	return (
		<div className="components-navigation">
			{ Children.map( children, ( child ) =>
				child
					? cloneElement( child, { active, items, parentItem } )
					: null
			) }
		</div>
	);
};

export default Navigation;
