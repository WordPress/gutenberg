const { paramCase: kebabCase } = require( 'change-case' );

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
