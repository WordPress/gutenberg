const cssClass = ( property ) => `style-${ property }`;

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
