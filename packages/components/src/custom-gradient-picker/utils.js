/**
 * External dependencies
 */
import { findIndex, map, some } from 'lodash';
import gradientParser from 'gradient-parser';

/**
 * Internal dependencies
 */
import {
	DEFAULT_GRADIENT,
	INSERT_POINT_WIDTH,
	MINIMUM_ABSOLUTE_LEFT_POSITION,
	MINIMUM_DISTANCE_BETWEEN_POINTS,
	KEYBOARD_CONTROL_POINT_VARIATION,
	HORIZONTAL_GRADIENT_ORIENTATION,
} from './constants';
import {
	serializeGradientColor,
	serializeGradientPosition,
	serializeGradient,
} from './serializer';

function tinyColorRgbToGradientColorStop( { r, g, b, a } ) {
	if ( a === 1 ) {
		return {
			type: 'rgb',
			value: [ r, g, b ],
		};
	}
	return {
		type: 'rgba',
		value: [ r, g, b, a ],
	};
}

export function getGradientWithColorStopAdded(
	gradientAST,
	relativePosition,
	rgbaColor
) {
	const colorStop = tinyColorRgbToGradientColorStop( rgbaColor );
	colorStop.length = {
		type: '%',
		value: relativePosition,
	};
	return {
		...gradientAST,
		colorStops: [ ...gradientAST.colorStops, colorStop ],
	};
}

export function getGradientWithPositionAtIndexChanged(
	gradientAST,
	index,
	relativePosition
) {
	return {
		...gradientAST,
		colorStops: gradientAST.colorStops.map(
			( colorStop, colorStopIndex ) => {
				if ( colorStopIndex !== index ) {
					return colorStop;
				}
				return {
					...colorStop,
					length: {
						...colorStop.length,
						value: relativePosition,
					},
				};
			}
		),
	};
}

export function isControlPointOverlapping(
	gradientAST,
	position,
	initialIndex
) {
	const initialPosition = parseInt(
		gradientAST.colorStops[ initialIndex ].length.value
	);
	const minPosition = Math.min( initialPosition, position );
	const maxPosition = Math.max( initialPosition, position );

	return some( gradientAST.colorStops, ( { length }, index ) => {
		const itemPosition = parseInt( length.value );
		return (
			index !== initialIndex &&
			( Math.abs( itemPosition - position ) <
				MINIMUM_DISTANCE_BETWEEN_POINTS ||
				( minPosition < itemPosition && itemPosition < maxPosition ) )
		);
	} );
}

function getGradientWithPositionAtIndexSummed(
	gradientAST,
	index,
	valueToSum
) {
	const currentPosition = gradientAST.colorStops[ index ].length.value;
	const newPosition = Math.max(
		0,
		Math.min( 100, parseInt( currentPosition ) + valueToSum )
	);
	if ( isControlPointOverlapping( gradientAST, newPosition, index ) ) {
		return gradientAST;
	}
	return getGradientWithPositionAtIndexChanged(
		gradientAST,
		index,
		newPosition
	);
}

export function getGradientWithPositionAtIndexIncreased( gradientAST, index ) {
	return getGradientWithPositionAtIndexSummed(
		gradientAST,
		index,
		KEYBOARD_CONTROL_POINT_VARIATION
	);
}

export function getGradientWithPositionAtIndexDecreased( gradientAST, index ) {
	return getGradientWithPositionAtIndexSummed(
		gradientAST,
		index,
		-KEYBOARD_CONTROL_POINT_VARIATION
	);
}

export function getGradientWithColorAtIndexChanged(
	gradientAST,
	index,
	rgbaColor
) {
	return {
		...gradientAST,
		colorStops: gradientAST.colorStops.map(
			( colorStop, colorStopIndex ) => {
				if ( colorStopIndex !== index ) {
					return colorStop;
				}
				return {
					...colorStop,
					...tinyColorRgbToGradientColorStop( rgbaColor ),
				};
			}
		),
	};
}

export function getGradientWithColorAtPositionChanged(
	gradientAST,
	relativePositionValue,
	rgbaColor
) {
	const index = findIndex( gradientAST.colorStops, ( colorStop ) => {
		return (
			colorStop &&
			colorStop.length &&
			colorStop.length.type === '%' &&
			colorStop.length.value === relativePositionValue.toString()
		);
	} );
	return getGradientWithColorAtIndexChanged( gradientAST, index, rgbaColor );
}

export function getGradientWithControlPointRemoved( gradientAST, index ) {
	return {
		...gradientAST,
		colorStops: gradientAST.colorStops.filter( ( elem, elemIndex ) => {
			return elemIndex !== index;
		} ),
	};
}

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

/**
 * Returns the marker points from a gradient AST.
 *
 * @param {Object} gradientAST An object representing the gradient AST.
 *
 * @return {Array.<{color: string, position: string, positionValue: number}>}
 *         An array of markerPoint objects.
 *         color:         A string with the color code ready to be used in css style e.g: "rgba( 1, 2 , 3, 0.5)".
 *         position:      A string with the position ready to be used in css style e.g: "70%".
 *         positionValue: A number with the relative position value e.g: 70.
 */
export function getMarkerPoints( gradientAST ) {
	if ( ! gradientAST ) {
		return [];
	}
	return map( gradientAST.colorStops, ( colorStop ) => {
		if (
			! colorStop ||
			! colorStop.length ||
			colorStop.length.type !== '%'
		) {
			return null;
		}
		return {
			color: serializeGradientColor( colorStop ),
			position: serializeGradientPosition( colorStop.length ),
			positionValue: parseInt( colorStop.length.value ),
		};
	} );
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

export function getGradientBarValue( gradientAST ) {
	// On radial gradients the bar should display a linear gradient.
	// On radial gradients the bar represents a slice of the gradient from the center until the outside.
	const background =
		gradientAST.type === 'radial-gradient'
			? getLinearGradientRepresentationOfARadial( gradientAST )
			: gradientAST.value;

	const markerPoints = getMarkerPoints( gradientAST );

	const hasGradient = gradientAST.value !== DEFAULT_GRADIENT;

	return {
		hasGradient,
		markerPoints,
		background,
	};
}

export function gradientAstReducer( state, action ) {
	const gradientAST = state;
	switch ( action.type ) {
		case 'ADD_BY_POSITION':
			return getGradientWithColorStopAdded(
				gradientAST,
				action.insertPosition,
				action.rgb
			);

		case 'REMOVE_BY_INDEX':
			return getGradientWithControlPointRemoved(
				gradientAST,
				action.index
			);

		case 'UPDATE_COLOR_BY_POSITION':
			return getGradientWithColorAtPositionChanged(
				gradientAST,
				action.insertPosition,
				action.rgb
			);

		case 'UPDATE_COLOR_BY_INDEX':
			return getGradientWithColorAtIndexChanged(
				gradientAST,
				action.index,
				action.rgb
			);

		case 'INCREASE_POSITION_BY_INDEX':
			return getGradientWithPositionAtIndexIncreased(
				gradientAST,
				action.gradientIndex
			);

		case 'DECREASE_POSITION_BY_INDEX':
			return getGradientWithPositionAtIndexDecreased(
				gradientAST,
				action.gradientIndex
			);

		case 'UPDATE_POSITION_BY_MOUSE':
			return ! isControlPointOverlapping(
				gradientAST,
				action.relativePosition,
				action.position
			)
				? getGradientWithPositionAtIndexChanged(
						gradientAST,
						action.position,
						action.relativePosition
				  )
				: gradientAST;
	}
}
