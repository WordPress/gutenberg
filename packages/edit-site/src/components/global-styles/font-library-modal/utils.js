export function setFallbackValues( font ) {
	if ( ! font.name ) {
		font.name = font.fontFamily || font.slug;
	}
	return font;
}

export function isUrlEncoded( url ) {
    if ( typeof uri !== 'string' ) {
        return false;
    }
	return url !== decodeURIComponent( url );
}
