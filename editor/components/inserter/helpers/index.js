/**
 * Helpers associated with the Inserter Component.
 *
 * This file contains a group of functions that help in managing the inserter.
 */

export const isShownBlock = state => block => block.title.toLowerCase().indexOf( state.filterValue.toLowerCase() ) !== -1;

export const listVisibleBlocksByCategory = ( state ) => ( blocks ) => {
	return blocks.reduce( ( groups, block ) => {
		if ( ! isShownBlock( state )( block ) ) {
			return groups;
		}
		if ( ! groups[ block.category ] ) {
			groups[ block.category ] = [];
		}
		groups[ block.category ].push( block );
		return groups;
	}, {} );
};

const flattenObjectIntoArray = ( object ) => {
	let list = [];
	for ( const key in object ) {
		list.push( object[ key ] );
	}
	list = list.reduce( ( values, objectValue ) => values.concat( objectValue ), [] );

	return list;
};

const nextFocusableRef = ( component ) => {
	const visibleBlocksByCategory = flattenObjectIntoArray( listVisibleBlocksByCategory( component.state )( component.blockTypes ) );
	const focusables = visibleBlocksByCategory.map( blockType => blockType.slug ).concat( 'search' );

	if ( null === component.state.focusedElementRef ) {
		return focusables[ 0 ];
	}

	const currentIndex = focusables.findIndex( ( elementRef ) => elementRef === component.state.focusedElementRef );
	const nextIndex = currentIndex + 1;
	const highestIndex = focusables.length - 1;

	// Check boundary so that the index is does not exceed the length.
	if ( nextIndex > highestIndex ) {
		// Cycle back to other end.
		return focusables[ 0 ];
	}

	return focusables[ nextIndex ];
};

const previousFocusableRef = ( component ) => {
	const visibleBlocksByCategory = flattenObjectIntoArray( listVisibleBlocksByCategory( component.state )( component.blockTypes ) );
	const focusables = visibleBlocksByCategory.map( blockType => blockType.slug ).concat( 'search' );

	// Initiate the menu with the first block.
	if ( null === component.state.focusedElementRef ) {
		return focusables[ 0 ];
	}

	const currentIndex = focusables.findIndex( ( elementRef ) => elementRef === component.state.focusedElementRef );
	const nextIndex = currentIndex - 1;
	const lowestIndex = 0;

	// Check boundary so that the index is does not exceed the length.
	if ( nextIndex < lowestIndex ) {
		// Cycle back to other end.
		return focusables[ focusables.length - 1 ];
	}

	return focusables[ nextIndex ];
};

export const focusNextFocusableRef = ( component ) => {
	const next = nextFocusableRef( component );
	component.changeMenuSelection( next );
};

export const focusPreviousFocusableRef = ( component ) => {
	const previous = previousFocusableRef( component );
	component.changeMenuSelection( previous );
};
