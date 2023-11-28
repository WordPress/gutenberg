// flattens the theme object to a single level
function flattenTheme( obj, parent, res = {} ) {
	for ( const key in obj ) {
		const propName = parent ? parent + '-' + key : key;
		if ( typeof obj[ key ] === 'object' ) {
			flattenTheme( obj[ key ], propName, res );
		} else {
			res[ propName.replace( '-default', '' ) ] = obj[ key ];
		}
	}
	return res;
}

// converts a theme object to a CSS string containing CSS variables
export const themeToCss = ( theme ) => {
	const flattenedTheme = flattenTheme( theme );
	return Object.entries( flattenedTheme )
		.map( ( [ key, value ] ) => `--wp-theme-${ key }: ${ value };` )
		.join( '\n' );
};
