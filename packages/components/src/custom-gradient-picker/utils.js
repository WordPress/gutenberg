/**
 * External dependencies
 */
import { findIndex, some } from 'lodash';

/**
 * Internal dependencies
 */
import {
	INSERT_POINT_WIDTH,
	MINIMUM_ABSOLUTE_LEFT_POSITION,
	MINIMUM_DISTANCE_BETWEEN_POINTS,
} from './constants';

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

export function getGradientWithColorStopAdded( parsedGradient, relativePosition, rgbaColor ) {
	const colorStop = tinyColorRgbToGradientColorStop( rgbaColor );
	colorStop.length = {
		type: '%',
		value: relativePosition,
	};
	return {
		...parsedGradient,
		colorStops: [
			...parsedGradient.colorStops,
			colorStop,
		],
	};
}

export function getGradientWithPositionAtIndexChanged( parsedGradient, index, relativePosition ) {
	return {
		...parsedGradient,
		colorStops: parsedGradient.colorStops.map(
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

export function isControlPointOverlapping( parsedGradient, position, initialIndex ) {
	const initialPosition = parseInt( parsedGradient.colorStops[ initialIndex ].length.value );
	const minPosition = Math.min( initialPosition, position );
	const maxPosition = Math.max( initialPosition, position );

	return some(
		parsedGradient.colorStops,
		( { length }, index ) => {
			const itemPosition = parseInt( length.value );
			return index !== initialIndex && (
				Math.abs( itemPosition - position ) < MINIMUM_DISTANCE_BETWEEN_POINTS ||
				( minPosition < itemPosition && itemPosition < maxPosition )
			);
		}
	);
}

function getGradientWithPositionAtIndexSummed( parsedGradient, index, valueToSum ) {
	const currentPosition = parsedGradient.colorStops[ index ].length.value;
	const newPosition = Math.max( 0, Math.min( 100, parseInt( currentPosition ) + valueToSum ) );
	if ( isControlPointOverlapping( parsedGradient, newPosition, index ) ) {
		return parsedGradient;
	}
	return getGradientWithPositionAtIndexChanged( parsedGradient, index, newPosition );
}

export function getGradientWithPositionAtIndexIncreased( parsedGradient, index ) {
	return getGradientWithPositionAtIndexSummed( parsedGradient, index, MINIMUM_DISTANCE_BETWEEN_POINTS );
}

export function getGradientWithPositionAtIndexDecreased( parsedGradient, index ) {
	return getGradientWithPositionAtIndexSummed( parsedGradient, index, -MINIMUM_DISTANCE_BETWEEN_POINTS );
}

export function getGradientWithColorAtIndexChanged( parsedGradient, index, rgbaColor ) {
	return {
		...parsedGradient,
		colorStops: parsedGradient.colorStops.map(
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

export function getGradientWithColorAtPositionChanged( parsedGradient, relativePositionValue, rgbaColor ) {
	const index = findIndex( parsedGradient.colorStops, ( colorStop ) => {
		return (
			colorStop &&
			colorStop.length &&
			colorStop.length.type === '%' &&
			colorStop.length.value === relativePositionValue.toString()
		);
	} );
	return getGradientWithColorAtIndexChanged( parsedGradient, index, rgbaColor );
}

export function getGradientWithControlPointRemoved( parsedGradient, index ) {
	return {
		...parsedGradient,
		colorStops: parsedGradient.colorStops.filter( ( elem, elemIndex ) => {
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
