const kebabCase = ( property ) =>
	property
		.replace( /([a-z0-9])([A-Z])/g, '$1-$2' )
		.replace( /([A-Z])([A-Z][a-z])/g, '$1-$2' )
		.toLowerCase();

const cssClass = ( property ) => `style-${ kebabCase( property ) }`;

const styles = new Proxy(
	{},
	{
		get( target, property ) {
			if ( typeof property === 'string' && property !== '__esModule' ) {
				return cssClass( property );
			}

			return Reflect.get( target, property );
		},
	}
);

module.exports = styles;
