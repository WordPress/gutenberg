function intToChar( int ) {
	const code = 'a'.charCodeAt( 0 );
	return String.fromCharCode( code + int );
}

const NUMBER_OF_CHARS_IN_ALPHABET = 26;

// returns a, b, c...aa, bb etc. for order lists that are nested in numeric ordered lists.
const getListItemCharCode = ( index ) => {
	const code = intToChar( index % NUMBER_OF_CHARS_IN_ALPHABET );
	const multiplier = Math.floor( index / NUMBER_OF_CHARS_IN_ALPHABET ) + 1;
	return Array.from( { length: multiplier } )
		.map( () => code )
		.join( '' );
};

// Return the bullet for a list item.
export const getListItemBullet = ( type, orderedListUsesNumbers, index ) => {
	if ( type === 'UL' ) {
		return '-';
	}
	return orderedListUsesNumbers
		? `${ index + 1 }.`
		: `${ getListItemCharCode( index ) }.`;
};
