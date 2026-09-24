export function getDimensionPresetCssVar( value?: string ) {
	if ( ! value ) {
		return;
	}

	const slug = value.match( /var:preset\|dimension\|(.+)/ );

	if ( ! slug ) {
		return value;
	}

	return `var(--wp--preset--dimension--${ slug[ 1 ] })`;
}
