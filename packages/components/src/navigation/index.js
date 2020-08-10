/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

const Navigation = ( { activeId, children, items: rawItems, rootTitle } ) => {
	const [ activeLevel, setActiveLevel ] = useState( 'root' );

	const mapItemData = ( items ) => {
		return items.map( ( item ) => {
			const itemChildren = rawItems.filter(
				( i ) => i.parent === item.id
			);
			return {
				...item,
				children: itemChildren,
				parent: item.parent || 'root',
				isActive: item.id === activeId,
				hasChildren: itemChildren.length > 0,
			};
		} );
	};
	const items = [
		{ id: 'root', title: rootTitle },
		...mapItemData( rawItems ),
	];

	const activeItem = items.find( ( item ) => item.id === activeId );
	const level = items.find( ( item ) => item.id === activeLevel );
	const levelItems = items.filter( ( item ) => item.parent === level.id );
	const parentLevel =
		level.id === 'root'
			? null
			: items.find( ( item ) => item.id === level.parent );

	useEffect( () => {
		if ( activeItem ) {
			setActiveLevel( activeItem.parent );
		}
	}, [] );

	return (
		<div className="components-navigation">
			{ children( {
				activeId,
				level,
				levelItems,
				parentLevel,
				setActiveLevel,
			} ) }
		</div>
	);
};

export default Navigation;
