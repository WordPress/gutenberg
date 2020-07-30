const Navigation = ( { activeId, children, items: rawItems, rootTitle } ) => {
	const mapItemData = ( items ) => {
		return items.map( ( item ) => {
			const itemChildren = rawItems.filter(
				( i ) => i.parent === item.id
			);
			return {
				...item,
				children: itemChildren,
				parent: item.parent || 'root',
			};
		} );
	};
	const items = [
		{ id: 'root', title: rootTitle },
		...mapItemData( rawItems ),
	];

	const activeItem = items.find( ( item ) => item.id === activeId );
	const currentLevel = activeItem
		? items.find( ( item ) => item.id === activeItem.parent )
		: { id: 'root', title: rootTitle };
	const parentLevel = currentLevel
		? items.find( ( item ) => item.id === currentLevel.parent )
		: null;
	const currentItems = currentLevel
		? items.filter( ( item ) => item.parent === currentLevel.id )
		: items.filter( ( item ) => item.parent === 'root' );
	const parentItems = parentLevel
		? items.filter( ( item ) => item.parent === parentLevel.id )
		: items.filter( ( item ) => item.parent === 'root' );

	return (
		<div className="components-navigation">
			{ children( {
				activeId,
				currentItems,
				currentLevel,
				parentItems,
				parentLevel,
			} ) }
		</div>
	);
};

export default Navigation;
