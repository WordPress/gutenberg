export function setFallbackValues ( font ) {
	if ( ! font.name ) {
		font.name = font.fontFamily || font.slug;
	}
	return font;
};