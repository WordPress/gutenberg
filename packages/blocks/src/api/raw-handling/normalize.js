export function normalize( string ) {
	// Normalize unicode to use composed characters.
	// This is unsupported in IE 11 but it's a nice-to-have feature, not mandatory.
	// Not normalizing the content will only affect older browsers and won't
	// entirely break the app.
	// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
	// See: https://core.trac.wordpress.org/ticket/30130
	// See: https://github.com/WordPress/gutenberg/pull/6983#pullrequestreview-125151075
	if ( String.prototype.normalize ) {
		return string.normalize();
	}

	return string;
}
