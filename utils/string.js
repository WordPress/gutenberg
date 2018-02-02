export function firstCharacterUppercase( label ) {
	// not a string
	if ( 'string' !== typeof label ) {
		return label;
	}

	return label.charAt( 0 ).toUpperCase() + label.slice( 1 ).toLowerCase();
}
