/**
 * Parts of this source were derived and modified from react-color,
 * released under the MIT license.
 *
 * https://github.com/lokesh/color-thief
 *
 * Copyright (c) 2015 Lokesh Dhakar
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
 * External dependencies
 */
import quantize from 'quantize';

const { XMLHttpRequest } = window;

/*
 * Color Thief v2.3.0
 * by Lokesh Dhakar - http://www.lokeshdhakar.com
 *
 * Thanks
 * ------
 * Nick Rabinowitz - For creating quantize.js.
 * John Schulz - For clean up and optimization. @JFSIII
 * Nathan Spady - For adding drag and drop support to the demo page.
 *
 * License
 * -------
 * Copyright Lokesh Dhakar
 * Released under the MIT license
 * https://raw.githubusercontent.com/lokesh/color-thief/master/LICENSE
 *
 * @license
 */

function createPixelArray( imgData, pixelCount, quality ) {
	const pixels = imgData;
	const pixelArray = [];

	for ( let i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality ) {
		offset = i * 4;
		r = pixels[ offset + 0 ];
		g = pixels[ offset + 1 ];
		b = pixels[ offset + 2 ];
		a = pixels[ offset + 3 ];

		// If pixel is mostly opaque and not white
		if ( typeof a === 'undefined' || a >= 125 ) {
			if ( ! ( r > 250 && g > 250 && b > 250 ) ) {
				pixelArray.push( [ r, g, b ] );
			}
		}
	}
	return pixelArray;
}

function validateOptions( options ) {
	let { colorCount, quality } = options;

	if (
		typeof colorCount === 'undefined' ||
		! Number.isInteger( colorCount )
	) {
		colorCount = 10;
	} else if ( colorCount === 1 ) {
		throw new Error(
			'colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()'
		);
	} else {
		colorCount = Math.max( colorCount, 2 );
		colorCount = Math.min( colorCount, 20 );
	}

	if ( typeof quality === 'undefined' || Number.isInteger( quality ) ) {
		quality = 10;
	} else if ( quality < 1 ) {
		quality = 10;
	}

	return {
		colorCount,
		quality,
	};
}

/*
  CanvasImage Class
  Class that wraps the html image element and canvas.
  It also simplifies some of the canvas context manipulation
  with a set of helper functions.
*/

const CanvasImage = function ( image ) {
	this.canvas = document.createElement( 'canvas' );
	this.context = this.canvas.getContext( '2d' );
	this.width = this.canvas.width = image.width;
	this.height = this.canvas.height = image.height;
	this.context.drawImage( image, 0, 0, this.width, this.height );
};

CanvasImage.prototype.getImageData = function () {
	return this.context.getImageData( 0, 0, this.width, this.height );
};

export const ColorThief = function () {};

/*
 * getColor(sourceImage[, quality])
 * returns {r: num, g: num, b: num}
 *
 * Use the median cut algorithm provided by quantize.js to cluster similar
 * colors and return the base color from the largest cluster.
 *
 * Quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
 * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
 * faster a color will be returned but the greater the likelihood that it will not be the visually
 * most dominant color.
 *
 * */
ColorThief.prototype.getColor = function ( sourceImage, quality = 10 ) {
	const palette = this.getPalette( sourceImage, 5, quality );
	/**
	 * Custom update:
	 * The palette may be null if the image is pure white.
	 */
	const dominantColor = palette ? palette[ 0 ] : undefined;
	return dominantColor;
};

/*
 * getPalette(sourceImage[, colorCount, quality])
 * returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
 *
 * Use the median cut algorithm provided by quantize.js to cluster similar colors.
 *
 * colorCount determines the size of the palette; the number of colors returned. If not set, it
 * defaults to 10.
 *
 * BUGGY: Function does not always return the requested amount of colors. It can be +/- 2.
 *
 * quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
 * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
 * faster the palette generation but the greater the likelihood that colors will be missed.
 *
 *
 */
ColorThief.prototype.getPalette = function (
	sourceImage,
	colorCount,
	quality
) {
	const options = validateOptions( {
		colorCount,
		quality,
	} );

	// Create custom CanvasImage object
	const image = new CanvasImage( sourceImage );
	const imageData = image.getImageData();
	const pixelCount = image.width * image.height;

	const pixelArray = createPixelArray(
		imageData.data,
		pixelCount,
		options.quality
	);

	// Send array to quantize function which clusters values
	// using median cut algorithm
	const cmap = quantize( pixelArray, options.colorCount );
	const palette = cmap ? cmap.palette() : null;

	return palette;
};

ColorThief.prototype.getImageData = function ( imageUrl, callback ) {
	const xhr = new XMLHttpRequest();
	xhr.open( 'GET', imageUrl, true );
	xhr.responseType = 'arraybuffer';
	xhr.onload = function () {
		if ( this.status === 200 ) {
			const uInt8Array = new Uint8Array( this.response );
			const binaryString = new Array( uInt8Array.length );
			for ( let i = 0; i < uInt8Array.length; i++ ) {
				binaryString[ i ] = String.fromCharCode( uInt8Array[ i ] );
			}
			const data = binaryString.join( '' );
			const base64 = window.btoa( data );
			callback( 'data:image/png;base64,' + base64 );
		}
	};
	xhr.send();
};
