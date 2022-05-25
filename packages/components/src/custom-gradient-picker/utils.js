/**
 * External dependencies
 */
import gradientParser from 'gradient-parser';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

/**
 * Internal dependencies
 */
import {
	DEFAULT_GRADIENT,
	HORIZONTAL_GRADIENT_ORIENTATION,
	DIRECTIONAL_ORIENTATION_ANGLE_MAP,
} from './constants';
import { serializeGradient } from './serializer';

extend( [ namesPlugin ] );

export function getLinearGradientRepresentation( gradientAST ) {
	return serializeGradient( {
		type: 'linear-gradient',
		orientation: HORIZONTAL_GRADIENT_ORIENTATION,
		colorStops: gradientAST.colorStops,
	} );
}

function hasUnsupportedLength( item ) {
	return item.length === undefined || item.length.type !== '%';
}

export function getGradientAstWithDefault( value ) {
	// gradientAST will contain the gradient AST as parsed by gradient-parser npm module.
	// More information of its structure available at https://www.npmjs.com/package/gradient-parser#ast.
	let gradientAST;

	try {
		gradientAST = gradientParser.parse( value )[ 0 ];
		gradientAST.value = value;
	} catch ( error ) {
		gradientAST = gradientParser.parse( DEFAULT_GRADIENT )[ 0 ];
		gradientAST.value = DEFAULT_GRADIENT;
	}

	if ( gradientAST.orientation?.type === 'directional' ) {
		gradientAST.orientation.type = 'angular';
		gradientAST.orientation.value = DIRECTIONAL_ORIENTATION_ANGLE_MAP[
			gradientAST.orientation.value
		].toString();
	}

	if ( gradientAST.colorStops.some( hasUnsupportedLength ) ) {
		const { colorStops } = gradientAST;
		const step = 100 / ( colorStops.length - 1 );
		colorStops.forEach( ( stop, index ) => {
			stop.length = {
				value: step * index,
				type: '%',
			};
		} );
		gradientAST.value = serializeGradient( gradientAST );
	}

	return gradientAST;
}

export function getGradientAstWithControlPoints(
	gradientAST,
	newControlPoints
) {
	return {
		...gradientAST,
		colorStops: newControlPoints.map( ( { position, color } ) => {
			const { r, g, b, a } = colord( color ).toRgb();
			return {
				length: {
					type: '%',
					value: position.toString(),
				},
				type: a < 1 ? 'rgba' : 'rgb',
				value: a < 1 ? [ r, g, b, a ] : [ r, g, b ],
			};
		} ),
	};
}

export function getStopCssColor( colorStop ) {
	switch ( colorStop.type ) {
		case 'hex':
			return `#${ colorStop.value }`;
		case 'literal':
			return colorStop.value;
		case 'rgb':
		case 'rgba':
			return `${ colorStop.type }(${ colorStop.value.join( ',' ) })`;
		default:
			// Should be unreachable if passing an AST from gradient-parser.
			// See https://github.com/rafaelcaricio/gradient-parser#ast.
			return 'transparent';
	}
}
