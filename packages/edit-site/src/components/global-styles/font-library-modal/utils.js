export function setUIValuesNeeded( font, extraValues = {} ) {
	if ( ! font.name ) {
		font.name = font.fontFamily || font.slug;
	}
	return {
		...font,
		...extraValues,
	};
}

export function isUrlEncoded( url ) {
	if ( typeof uri !== 'string' ) {
		return false;
	}
	return url !== decodeURIComponent( url );
}
