/**
 * CSS that should be preserved when switching theme style variations.
 *
 * Selecting a variation writes that variation's `styles.css` into the user
 * global styles config. That must not be treated as Additional CSS and carried
 * onto Default or other variations (see #86190).
 *
 * @param userCss         Current user styles CSS (may include variation CSS).
 * @param themeCssSources CSS strings defined by theme style variations.
 * @return Remaining user-authored CSS, if any.
 */
export function getPreservedUserCss(
	userCss: string | undefined,
	themeCssSources: Array< string | undefined >
): string {
	if ( ! userCss?.trim() ) {
		return '';
	}

	let remaining = userCss.trim();
	const sources = themeCssSources
		.map( ( css ) => css?.trim() )
		.filter( ( css ): css is string => !! css )
		.sort( ( a, b ) => b.length - a.length );

	for ( const themeCss of sources ) {
		if ( remaining.includes( themeCss ) ) {
			remaining = remaining.split( themeCss ).join( ' ' );
		}
	}

	return remaining.replace( /\s+/g, ' ' ).trim();
}
