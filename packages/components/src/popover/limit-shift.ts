/**
 * External dependencies
 */
import type {
	Axis,
	Coords,
	Placement,
	Side,
	MiddlewareArguments,
} from '@floating-ui/react-dom';

/**
 * Parts of this source were derived and modified from `floating-ui`,
 * released under the MIT license.
 *
 * https://github.com/floating-ui/floating-ui
 *
 * Copyright (c) 2021 Floating UI contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Custom limiter function for the `shift` middleware.
 * This function is mostly identical default `limitShift` from ``@floating-ui`;
 * the only difference is that, when computing the min/max shift limits, it
 * also takes into account the iframe offset that is added by the
 * custom "frameOffset" middleware.
 *
 * All unexported types and functions are also from the `@floating-ui` library,
 * and have been copied to this file for convenience.
 */

type LimitShiftOffset =
	| ( ( args: MiddlewareArguments ) =>
			| number
			| {
					/**
					 * Offset the limiting of the axis that runs along the alignment of the
					 * floating element.
					 */
					mainAxis?: number;
					/**
					 * Offset the limiting of the axis that runs along the side of the
					 * floating element.
					 */
					crossAxis?: number;
			  } )
	| number
	| {
			/**
			 * Offset the limiting of the axis that runs along the alignment of the
			 * floating element.
			 */
			mainAxis?: number;
			/**
			 * Offset the limiting of the axis that runs along the side of the
			 * floating element.
			 */
			crossAxis?: number;
	  };

type LimitShiftOptions = {
	/**
	 * Offset when limiting starts. `0` will limit when the opposite edges of the
	 * reference and floating elements are aligned.
	 * - positive = start limiting earlier
	 * - negative = start limiting later
	 */
	offset: LimitShiftOffset;
	/**
	 * Whether to limit the axis that runs along the alignment of the floating
	 * element.
	 */
	mainAxis: boolean;
	/**
	 * Whether to limit the axis that runs along the side of the floating element.
	 */
	crossAxis: boolean;
};

function getSide( placement: Placement ): Side {
	return placement.split( '-' )[ 0 ] as Side;
}

function getMainAxisFromPlacement( placement: Placement ): Axis {
	return [ 'top', 'bottom' ].includes( getSide( placement ) ) ? 'x' : 'y';
}

function getCrossAxis( axis: Axis ): Axis {
	return axis === 'x' ? 'y' : 'x';
}

export const limitShift = (
	options: Partial< LimitShiftOptions > = {}
): {
	options: Partial< LimitShiftOffset >;
	fn: ( middlewareArguments: MiddlewareArguments ) => Coords;
} => ( {
	options,
	fn( middlewareArguments ) {
		const { x, y, placement, rects, middlewareData } = middlewareArguments;
		const {
			offset = 0,
			mainAxis: checkMainAxis = true,
			crossAxis: checkCrossAxis = true,
		} = options;

		const coords = { x, y };
		const mainAxis = getMainAxisFromPlacement( placement );
		const crossAxis = getCrossAxis( mainAxis );

		let mainAxisCoord = coords[ mainAxis ];
		let crossAxisCoord = coords[ crossAxis ];

		const rawOffset =
			typeof offset === 'function'
				? offset( middlewareArguments )
				: offset;
		const computedOffset =
			typeof rawOffset === 'number'
				? { mainAxis: rawOffset, crossAxis: 0 }
				: { mainAxis: 0, crossAxis: 0, ...rawOffset };

		// At the moment of writing, this is the only difference
		// with the `limitShift` function from `@floating-ui`.
		// This offset needs to be added to all min/max limits
		// in order to make the shift-limiting work as expected.
		const additionalFrameOffset = {
			x: 0,
			y: 0,
			...middlewareData.frameOffset?.amount,
		};

		if ( checkMainAxis ) {
			const len = mainAxis === 'y' ? 'height' : 'width';
			const limitMin =
				rects.reference[ mainAxis ] -
				rects.floating[ len ] +
				computedOffset.mainAxis +
				additionalFrameOffset[ mainAxis ];
			const limitMax =
				rects.reference[ mainAxis ] +
				rects.reference[ len ] -
				computedOffset.mainAxis +
				additionalFrameOffset[ mainAxis ];

			if ( mainAxisCoord < limitMin ) {
				mainAxisCoord = limitMin;
			} else if ( mainAxisCoord > limitMax ) {
				mainAxisCoord = limitMax;
			}
		}

		if ( checkCrossAxis ) {
			const len = mainAxis === 'y' ? 'width' : 'height';
			const isOriginSide = [ 'top', 'left' ].includes(
				getSide( placement )
			);
			const limitMin =
				rects.reference[ crossAxis ] -
				rects.floating[ len ] +
				( isOriginSide
					? middlewareData.offset?.[ crossAxis ] ?? 0
					: 0 ) +
				( isOriginSide ? 0 : computedOffset.crossAxis ) +
				additionalFrameOffset[ crossAxis ];
			const limitMax =
				rects.reference[ crossAxis ] +
				rects.reference[ len ] +
				( isOriginSide
					? 0
					: middlewareData.offset?.[ crossAxis ] ?? 0 ) -
				( isOriginSide ? computedOffset.crossAxis : 0 ) +
				additionalFrameOffset[ crossAxis ];

			if ( crossAxisCoord < limitMin ) {
				crossAxisCoord = limitMin;
			} else if ( crossAxisCoord > limitMax ) {
				crossAxisCoord = limitMax;
			}
		}

		return {
			[ mainAxis ]: mainAxisCoord,
			[ crossAxis ]: crossAxisCoord,
		} as Coords;
	},
} );
