import changeCase from 'change-case';

const { paramCase: kebabCase } = changeCase;
const styles = new Proxy(
	{},
	{
		get( target, property ) {
			if ( typeof property === 'string' && property !== '__esModule' ) {
				return `style-${ kebabCase( property ) }`;
			}

			return Reflect.get( target, property );
		},
	}
);

export default styles;
