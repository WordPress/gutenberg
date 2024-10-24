/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { generateColors } from './color';
import { themeToCss } from './utils';

// lightweight way to add styles to a class name
const toHash = ( str ) => {
	let i = 0,
		out = 11;
	while ( i < str.length ) out = ( 101 * out + str.charCodeAt( i++ ) ) >>> 0; //eslint-disable-line no-bitwise
	return 'wp-' + out;
};

const addStyle = ( target, className, cssText ) => {
	const style = document.createElement( 'style' );
	style.id = className;
	style.append( cssText );
	target.append( style );
};

const merge = ( compiled, target ) => {
	const name = toHash( compiled );
	if ( ! document.getElementById( name ) ) {
		addStyle( target, name, `.${ name } { ${ compiled }}` );
	}
	return name;
};

// theme provider component that generates a theme and adds appropriate tokens to the head
export const ThemeProvider = ( {
	as = 'div',
	color,
	fun,
	isDark,
	...props
} ) => {
	const { className, children, ...rest } = props;
	const styles = themeToCss( {
		color: generateColors( {
			color,
			fun,
			isDark,
		} ),
	} );
	const name = merge( styles, document.head );
	return createElement(
		as,
		{
			className: [ name, className ].join( ' ' ),
			...rest,
		},
		children
	);
};
