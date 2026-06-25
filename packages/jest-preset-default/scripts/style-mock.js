function toKebabCase( value ) {
	return String( value )
		.replace( /([a-z0-9])([A-Z])/g, '$1-$2' )
		.replace( /([A-Z])([A-Z][a-z])/g, '$1-$2' )
		.toLowerCase();
}

const styles = new Proxy(
	{},
	{
		get( target, property ) {
			if ( property === '__esModule' ) {
				return false;
			}

			if ( typeof property === 'symbol' ) {
				return target[ property ];
			}

			return toKebabCase( property );
		},
	}
);

module.exports = styles;
