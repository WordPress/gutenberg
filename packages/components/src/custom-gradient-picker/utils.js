/**
 * External dependencies
 */
import gradientParser from 'gradient-parser';

/**
 * Internal dependencies
 */
import {
	DEFAULT_GRADIENT,
	INSERT_POINT_WIDTH,
	MINIMUM_ABSOLUTE_LEFT_POSITION,
	HORIZONTAL_GRADIENT_ORIENTATION,
} from './constants';
import { serializeGradient } from './serializer';

export function getHorizontalRelativeGradientPosition(
	mouseXCoordinate,
	containerElement,
	positionedElementWidth
) {
	if ( ! containerElement ) {
		return;
	}
	const { x, width } = containerElement.getBoundingClientRect();
	const absolutePositionValue =
		mouseXCoordinate -
		x -
		MINIMUM_ABSOLUTE_LEFT_POSITION -
		positionedElementWidth / 2;
	const availableWidth =
		width - MINIMUM_ABSOLUTE_LEFT_POSITION - INSERT_POINT_WIDTH;
	return Math.round(
		Math.min(
			Math.max( ( absolutePositionValue * 100 ) / availableWidth, 0 ),
			100
		)
	);
}

export function getLinearGradientRepresentationOfARadial( gradientAST ) {
	return serializeGradient( {
		type: 'linear-gradient',
		orientation: HORIZONTAL_GRADIENT_ORIENTATION,
		colorStops: gradientAST.colorStops,
	} );
}

const DIRECTIONAL_ORIENTATION_ANGLE_MAP = {
	top: 0,
	'top right': 45,
	'right top': 45,
	right: 90,
	'right bottom': 135,
	'bottom right': 135,
	bottom: 180,
	'bottom left': 225,
	'left bottom': 225,
	left: 270,
	'top left': 315,
	'left top': 315,
};

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
