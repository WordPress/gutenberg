/**
 * Parts of this source were derived and modified from react-color,
 * released under the MIT license.
 *
 * https://github.com/casesandberg/react-color/
 *
 * Copyright (c) 2015 Case Sandberg
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * External dependencies
 */
import { each } from 'lodash';
import tinycolor from 'tinycolor2';

/**
 * Given a hex color, get all other color properties (rgb, alpha, etc).
 *
 * @param {Object|string} data A hex color string or an object with a hex property
 * @param {string} oldHue A reference to the hue of the previous color, otherwise dragging the saturation to zero will reset the current hue to zero as well. See https://github.com/casesandberg/react-color/issues/29#issuecomment-132686909.
 * @return {Object} An object of different color representations.
 */
export function colorToState( data = {}, oldHue = false ) {
	const color = data.hex ? tinycolor( data.hex ) : tinycolor( data );
	const hsl = color.toHsl();
	hsl.h = Math.round( hsl.h );
	hsl.s = Math.round( hsl.s * 100 );
	hsl.l = Math.round( hsl.l * 100 );
	const hsv = color.toHsv();
	hsv.h = Math.round( hsv.h );
	hsv.s = Math.round( hsv.s * 100 );
	hsv.v = Math.round( hsv.v * 100 );
	const rgb = color.toRgb();
	const hex = color.toHex();
	if ( hsl.s === 0 ) {
		hsl.h = oldHue || 0;
		hsv.h = oldHue || 0;
	}
	const transparent = hex === '000000' && rgb.a === 0;

	return {
		color,
		hex: transparent ? 'transparent' : `#${ hex }`,
		hsl,
		hsv,
		oldHue: data.h || oldHue || hsl.h,
		rgb,
		source: data.source,
	};
}

/**
 * Get the top/left offsets of a point in a container, also returns the container width/height.
 *
 * @param {Event} e Mouse or touch event with a location coordinate.
 * @param {HTMLElement} container The container div, returned point is relative to this container.
 * @return {Object} An object of the offset positions & container size.
 */
function getPointOffset( e, container ) {
	e.preventDefault();
	const {
		left: containerLeft,
		top: containerTop,
		width,
		height,
	} = container.getBoundingClientRect();
	const x = typeof e.pageX === 'number' ? e.pageX : e.touches[ 0 ].pageX;
	const y = typeof e.pageY === 'number' ? e.pageY : e.touches[ 0 ].pageY;
	let left = x - ( containerLeft + window.pageXOffset );
	let top = y - ( containerTop + window.pageYOffset );

	if ( left < 0 ) {
		left = 0;
	} else if ( left > width ) {
		left = width;
	} else if ( top < 0 ) {
		top = 0;
	} else if ( top > height ) {
		top = height;
	}

	return { top, left, width, height };
}

/**
 * Check if a string is a valid hex color code.
 *
 * @param {string} hex A possible hex color.
 * @return {boolean} True if the color is a valid hex color.
 */
export function isValidHex( hex ) {
	// disable hex4 and hex8
	const lh = String( hex ).charAt( 0 ) === '#' ? 1 : 0;
	return (
		hex.length !== 4 + lh && hex.length < 7 + lh && tinycolor( hex ).isValid()
	);
}

/**
 * Check an object for any valid color properties.
 *
 * @param {Object} data A possible object representing a color.
 * @return {Object|boolean} If a valid representation of color, returns the data object. Otherwise returns false.
 */
export function simpleCheckForValidColor( data ) {
	const keysToCheck = [ 'r', 'g', 'b', 'a', 'h', 's', 'l', 'v' ];
	let checked = 0;
	let passed = 0;
	each( keysToCheck, ( letter ) => {
		if ( data[ letter ] ) {
			checked += 1;
			if ( ! isNaN( data[ letter ] ) ) {
				passed += 1;
			}
		}
	} );
	return checked === passed ? data : false;
}

/**
 * Calculate the current alpha based on a mouse or touch event
 *
 * @param {Event} e A mouse or touch event on the alpha bar.
 * @param {Object} props The current component props
 * @param {HTMLElement} container The container div for the alpha bar graph.
 * @return {Object|null} If the alpha value has changed, returns a new color object.
 */
export function calculateAlphaChange( e, props, container ) {
	const { left, width } = getPointOffset( e, container );
	const a = left < 0 ? 0 : Math.round( ( left * 100 ) / width ) / 100;

	if ( props.hsl.a !== a ) {
		return {
			h: props.hsl.h,
			s: props.hsl.s,
			l: props.hsl.l,
			a,
			source: 'rgb',
		};
	}
	return null;
}

/**
 * Calculate the current hue based on a mouse or touch event
 *
 * @param {Event} e A mouse or touch event on the hue bar.
 * @param {Object} props The current component props
 * @param {HTMLElement} container The container div for the hue bar graph.
 * @return {Object|null} If the hue value has changed, returns a new color object.
 */
export function calculateHueChange( e, props, container ) {
	const { left, width } = getPointOffset( e, container );
	const percent = ( left * 100 ) / width;
	const h = left >= width ? 359 : ( 360 * percent ) / 100;

	if ( props.hsl.h !== h ) {
		return {
			h,
			s: props.hsl.s,
			l: props.hsl.l,
			a: props.hsl.a,
			source: 'rgb',
		};
	}
	return null;
}

/**
 * Calculate the current saturation & brightness based on a mouse or touch event
 *
 * @param {Event} e A mouse or touch event on the saturation graph.
 * @param {Object} props The current component props
 * @param {HTMLElement} container The container div for the 2D saturation graph.
 * @return {Object} Returns a new color object.
 */
export function calculateSaturationChange( e, props, container ) {
	const { top, left, width, height } = getPointOffset( e, container );
	const saturation = left < 0 ? 0 : ( left * 100 ) / width;
	let bright = top >= height ? 0 : -( ( top * 100 ) / height ) + 100;
	// `v` values less than 1 are considered in the [0,1] range, causing unexpected behavior at the bottom
	// of the chart. To fix this, we assume any value less than 1 should be 0 brightness.
	if ( bright < 1 ) {
		bright = 0;
	}

	return {
		h: props.hsl.h,
		s: saturation,
		v: bright,
		a: props.hsl.a,
		source: 'rgb',
	};
}
