import gradientParser from 'gradient-parser';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import {
	DEFAULT_GRADIENT,
	HORIZONTAL_GRADIENT_ORIENTATION,
	DIRECTIONAL_ORIENTATION_ANGLE_MAP,
	HUE_INTERPOLATION_METHODS,
	POLAR_INTERPOLATION_COLOR_SPACES,
	RECTANGULAR_INTERPOLATION_COLOR_SPACES,
} from './constants';
import { serializeGradient } from './serializer';
import type { ControlPoint, GradientAST } from './types';

extend( [ namesPlugin ] );

export function getLinearGradientRepresentation(
	gradientAST: gradientParser.GradientNode
) {
	return serializeGradient( {
		type: 'linear-gradient',
		orientation: HORIZONTAL_GRADIENT_ORIENTATION,
		colorStops: gradientAST.colorStops,
	} );
}

function hasUnsupportedLength( item: gradientParser.ColorStop ) {
	return item.length === undefined || item.length.type !== '%';
}

/**
 * Reads the first argument of a gradient, the one that holds the orientation
 * and the color interpolation method, as a list of space separated tokens.
 *
 * @param gradient CSS gradient.
 * @param start    Index right after the opening parenthesis.
 */
function readFirstArgument( gradient: string, start: number ) {
	const tokens: string[] = [];
	let token = '';
	let depth = 0;

	for ( let index = start; index < gradient.length; index++ ) {
		const char = gradient[ index ];

		if ( depth === 0 && ( char === ',' || char === ')' ) ) {
			if ( token ) {
				tokens.push( token );
			}
			return { tokens, end: index };
		}

		if ( char === '(' ) {
			depth++;
		} else if ( char === ')' ) {
			depth--;
		}

		if ( depth === 0 && /\s/.test( char ) ) {
			if ( token ) {
				tokens.push( token );
			}
			token = '';
		} else {
			token += char;
		}
	}

	// The gradient is missing its closing parenthesis.
	return undefined;
}

/**
 * `gradient-parser` can't read a color interpolation method such as
 * `in oklch`, so it is taken out of the gradient before it is parsed.
 *
 * Only the first argument is searched, at its top level, so a color stop like
 * `color-mix( in srgb, … )` is never mistaken for one.
 *
 * @param gradient CSS gradient.
 */
function extractColorInterpolation( gradient: string ) {
	const start = gradient.indexOf( '(' ) + 1;
	const firstArgument = start && readFirstArgument( gradient, start );
	if ( ! firstArgument ) {
		return { gradient };
	}

	const { tokens, end } = firstArgument;
	const words = tokens.map( ( token ) => token.toLowerCase() );
	const index = words.indexOf( 'in' );
	if ( index === -1 ) {
		return { gradient };
	}

	const colorSpace = words[ index + 1 ];
	let length;
	if (
		POLAR_INTERPOLATION_COLOR_SPACES.includes( colorSpace ) &&
		HUE_INTERPOLATION_METHODS.includes( words[ index + 2 ] ) &&
		words[ index + 3 ] === 'hue'
	) {
		length = 4;
	} else if (
		RECTANGULAR_INTERPOLATION_COLOR_SPACES.includes( colorSpace ) ||
		POLAR_INTERPOLATION_COLOR_SPACES.includes( colorSpace )
	) {
		length = 2;
	} else {
		return { gradient };
	}

	const remainder = [
		...tokens.slice( 0, index ),
		...tokens.slice( index + length ),
	].join( ' ' );
	// Without an orientation, the comma after the first argument goes too.
	const hasEmptyFirstArgument = ! remainder && gradient[ end ] === ',';

	return {
		gradient:
			gradient.slice( 0, start ) +
			remainder +
			gradient.slice( hasEmptyFirstArgument ? end + 1 : end ),
		colorInterpolation: words.slice( index, index + length ).join( ' ' ),
	};
}

export function getGradientAstWithDefault( value?: string | null ) {
	// gradientAST will contain the gradient AST as parsed by gradient-parser npm module.
	// More information of its structure available at https://www.npmjs.com/package/gradient-parser#ast.
	let gradientAST: GradientAST | undefined;
	let hasGradient = !! value;

	const { gradient: valueToParse, colorInterpolation } =
		extractColorInterpolation( value ?? DEFAULT_GRADIENT );

	try {
		gradientAST = gradientParser.parse( valueToParse )[ 0 ];
		if ( colorInterpolation ) {
			gradientAST.colorInterpolation = colorInterpolation;
		}
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn(
			'wp.components.CustomGradientPicker failed to parse the gradient with error',
			error
		);

		gradientAST = gradientParser.parse( DEFAULT_GRADIENT )[ 0 ];
		hasGradient = false;
	}

	if (
		! Array.isArray( gradientAST.orientation ) &&
		gradientAST.orientation?.type === 'directional'
	) {
		gradientAST.orientation = {
			type: 'angular',
			value: DIRECTIONAL_ORIENTATION_ANGLE_MAP[
				gradientAST.orientation.value
			].toString(),
		};
	}

	if ( gradientAST.colorStops.some( hasUnsupportedLength ) ) {
		const { colorStops } = gradientAST;
		const step = 100 / ( colorStops.length - 1 );
		colorStops.forEach( ( stop, index ) => {
			stop.length = {
				value: `${ step * index }`,
				type: '%',
			};
		} );
	}

	return { gradientAST, hasGradient };
}

export function getGradientAstWithControlPoints(
	gradientAST: GradientAST,
	newControlPoints: ControlPoint[]
) {
	return {
		...gradientAST,
		colorStops: newControlPoints.map( ( { position, color } ) => {
			const { r, g, b, a } = colord( color ).toRgb();
			return {
				length: {
					type: '%',
					value: position?.toString(),
				},
				type: a < 1 ? 'rgba' : 'rgb',
				value:
					a < 1
						? [ `${ r }`, `${ g }`, `${ b }`, `${ a }` ]
						: [ `${ r }`, `${ g }`, `${ b }` ],
			};
		} ),
	} as GradientAST;
}

export function getStopCssColor( colorStop: gradientParser.ColorStop ) {
	switch ( colorStop.type ) {
		case 'hex':
			return `#${ colorStop.value }`;
		case 'literal':
			return colorStop.value;
		case 'var':
			return `${ colorStop.type }(${ colorStop.value })`;
		case 'rgb':
		case 'rgba':
			return `${ colorStop.type }(${ colorStop.value.join( ',' ) })`;
		case 'hsl': {
			const [ hue, saturation, lightness ] = colorStop.value;
			return `hsl(${ hue },${ saturation }%,${ lightness }%)`;
		}
		case 'hsla': {
			const [ hue, saturation, lightness, alpha ] = colorStop.value;
			return `hsla(${ hue },${ saturation }%,${ lightness }%,${ alpha })`;
		}
		default:
			// Should be unreachable if passing an AST from gradient-parser.
			// See https://github.com/rafaelcaricio/gradient-parser#ast.
			return 'transparent';
	}
}
