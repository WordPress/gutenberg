/**
 * External dependencies
 */
import isPropValid from '@emotion/is-prop-valid';
import { isArray, isPlainObject, isString } from 'lodash';
/**
 * WordPress dependencies
 */
import { forwardRef, createElement } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { domElements, getCssVariableValue } from './utils';
import { globalStylesManager } from './manager';
import { useStyleSystemContext } from './context';

const filterUnstyledClassName = ( css ) => !! css && css !== 'wp-gs-0';

export const useStyledClassName = (
	{ className, css, sx } = { className: '' }
) => {
	let cssToCompile = [];
	const { theme } = useStyleSystemContext();
	const themeStyles = getCompiledThemeStyles( { sx, theme } );
	const themeCss = globalStylesManager.css( themeStyles );

	if ( css ) {
		if ( isArray( css ) ) {
			cssToCompile = css;
		} else if ( isString( css ) || isPlainObject( css ) ) {
			cssToCompile.push( css );
		}
	}

	const compiledCss = cssToCompile.map( ( precompiledCss ) => {
		try {
			return globalStylesManager.css( precompiledCss );
		} catch {
			return undefined;
		}
	} );

	const classes = globalStylesManager.cx(
		[ className, ...compiledCss, themeCss ].filter( filterUnstyledClassName )
	);

	return classes || undefined;
};

const getVariableFromTheme = ( prop ) => {
	const key = getCssVariableValue( prop );

	return `var(${ key })`;
};

const getCompiledThemeStyles = ( { sx, theme } ) => {
	if ( ! sx ) {
		return '';
	}

	const compiledStyles = Object.keys( sx ).reduce( ( styles, key ) => {
		const value = sx[ key ];
		const nextValue = isPlainObject( value ) ?
			getCompiledThemeStyles( { sx: value, theme } ) :
			getVariableFromTheme( value );

		return { ...styles, [ key ]: nextValue };
	}, {} );

	return compiledStyles;
};

const sanitizeProps = ( props ) => {
	return Object.keys( props ).reduce( ( sanitized, key ) => {
		const value = props[ key ];
		if ( isPropValid( key ) ) {
			return { ...sanitized, [ key ]: value };
		}
		return value;
	}, {} );
};

const createStyledElement = ( tag ) => {
	return forwardRef( ( { className, css, sx, ...props }, ref ) => {
		const classes = useStyledClassName( { className, css, sx } );

		return createElement( tag, {
			...sanitizeProps( props ),
			className: classes,
			ref,
		} );
	} );
};

export const StyledElement = domElements.reduce( ( primitives, tag ) => {
	return {
		...primitives,
		[ tag ]: createStyledElement( tag ),
	};
}, {} );

export const SE = StyledElement;
