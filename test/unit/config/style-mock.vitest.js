function toKebabCase( value ) {
	return value
		.replace( /([a-z0-9])([A-Z])/g, '$1-$2' )
		.replace( /([A-Z])([A-Z][a-z])/g, '$1-$2' )
		.replace( /[^a-zA-Z0-9]+/g, '-' )
		.replace( /^-|-$/g, '' )
		.toLowerCase();
}

const styles = new Proxy(
	{},
	{
		get( target, property ) {
			if ( typeof property === 'string' && property !== '__esModule' ) {
				return `style-${ toKebabCase( property ) }`;
			}

			return Reflect.get( target, property );
		},
	}
);

export default styles;
