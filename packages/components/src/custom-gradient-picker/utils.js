/**
 * External dependencies
 */
import { findIndex, map, some } from 'lodash';

/**
 * Internal dependencies
 */
import {
	INSERT_POINT_WIDTH,
	MINIMUM_ABSOLUTE_LEFT_POSITION,
	MINIMUM_DISTANCE_BETWEEN_POINTS,
} from './constants';
import {
	serializeGradientColor,
	serializeGradientPosition,
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

export function getGradientWithColorStopAdded( gradientAST, relativePosition, rgbaColor ) {
	const colorStop = tinyColorRgbToGradientColorStop( rgbaColor );
	colorStop.length = {
		type: '%',
		value: relativePosition,
	};
	return {
		...gradientAST,
		colorStops: [
			...gradientAST.colorStops,
			colorStop,
		],
	};
}

export function getGradientWithPositionAtIndexChanged( gradientAST, index, relativePosition ) {
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

export function isControlPointOverlapping( gradientAST, position, initialIndex ) {
	const initialPosition = parseInt( gradientAST.colorStops[ initialIndex ].length.value );
	const minPosition = Math.min( initialPosition, position );
	const maxPosition = Math.max( initialPosition, position );

	return some(
		gradientAST.colorStops,
		( { length }, index ) => {
			const itemPosition = parseInt( length.value );
			return index !== initialIndex && (
				Math.abs( itemPosition - position ) < MINIMUM_DISTANCE_BETWEEN_POINTS ||
				( minPosition < itemPosition && itemPosition < maxPosition )
			);
		}
	);
}

function getGradientWithPositionAtIndexSummed( gradientAST, index, valueToSum ) {
	const currentPosition = gradientAST.colorStops[ index ].length.value;
	const newPosition = Math.max( 0, Math.min( 100, parseInt( currentPosition ) + valueToSum ) );
	if ( isControlPointOverlapping( gradientAST, newPosition, index ) ) {
		return gradientAST;
	}
	return getGradientWithPositionAtIndexChanged( gradientAST, index, newPosition );
}

export function getGradientWithPositionAtIndexIncreased( gradientAST, index ) {
	return getGradientWithPositionAtIndexSummed( gradientAST, index, MINIMUM_DISTANCE_BETWEEN_POINTS );
}

export function getGradientWithPositionAtIndexDecreased( gradientAST, index ) {
	return getGradientWithPositionAtIndexSummed( gradientAST, index, -MINIMUM_DISTANCE_BETWEEN_POINTS );
}

export function getGradientWithColorAtIndexChanged( gradientAST, index, rgbaColor ) {
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

export function getGradientWithColorAtPositionChanged( gradientAST, relativePositionValue, rgbaColor ) {
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

export function getHorizontalRelativeGradientPosition( mouseXCoordinate, containerElement, positionedElementWidth ) {
	if ( ! containerElement ) {
		return;
	}
	const { x, width } = containerElement.getBoundingClientRect();
	const absolutePositionValue = mouseXCoordinate - x - MINIMUM_ABSOLUTE_LEFT_POSITION - ( positionedElementWidth / 2 );
	const availableWidth = width - MINIMUM_ABSOLUTE_LEFT_POSITION - INSERT_POINT_WIDTH;
	return Math.round(
		Math.min( Math.max( ( absolutePositionValue * 100 ) / availableWidth, 0 ), 100 )
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
		if ( ! colorStop || ! colorStop.length || colorStop.length.type !== '%' ) {
			return null;
		}
		return {
			color: serializeGradientColor( colorStop ),
			position: serializeGradientPosition( colorStop.length ),
			positionValue: parseInt( colorStop.length.value ),
		};
	} );
}
