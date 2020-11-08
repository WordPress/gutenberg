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
import classnames from 'classnames';
import { debounce, noop, partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Alpha from './alpha';
import Hue from './hue';
import Inputs from './inputs';
import Saturation from './saturation';
import { colorToState, simpleCheckForValidColor, isValidHex } from './utils';

function toLowerCase( value ) {
	return String( value ).toLowerCase();
}

function isValueEmpty( data ) {
	if ( data.source === 'hex' && ! data.hex ) {
		return true;
	} else if (
		data.source === 'hsl' &&
		( ! data.h || ! data.s || ! data.l )
	) {
		return true;
	} else if (
		data.source === 'rgb' &&
		( ! data.r || ! data.g || ! data.b ) &&
		( ! data.h || ! data.s || ! data.v || ! data.a ) &&
		( ! data.h || ! data.s || ! data.l || ! data.a )
	) {
		return true;
	}
	return false;
}

function isValidColor( colors ) {
	return colors.hex
		? isValidHex( colors.hex )
		: simpleCheckForValidColor( colors );
}

/**
 * Function that creates the new color object
 * from old data and the new value.
 *
 * @param {Object} oldColors The old color object.
 * @param {string} oldColors.hex
 * @param {Object} oldColors.rgb
 * @param {number} oldColors.rgb.r
 * @param {number} oldColors.rgb.g
 * @param {number} oldColors.rgb.b
 * @param {number} oldColors.rgb.a
 * @param {Object} oldColors.hsl
 * @param {number} oldColors.hsl.h
 * @param {number} oldColors.hsl.s
 * @param {number} oldColors.hsl.l
 * @param {number} oldColors.hsl.a
 * @param {string} oldColors.draftHex Same format as oldColors.hex
 * @param {Object} oldColors.draftRgb Same format as oldColors.rgb
 * @param {Object} oldColors.draftHsl Same format as oldColors.hsl
 * @param {Object} data Data containing the new value to update.
 * @param {Object} data.source One of `hex`, `rgb`, `hsl`.
 * @param {string|number} data.value Value to update.
 * @param {string} data.valueKey Depends on `data.source` values:
 *   - when source = `rgb`, valuKey can be `r`, `g`, `b`, or `a`.
 *   - when source = `hsl`, valuKey can be `h`, `s`, `l`, or `a`.
 * @return {Object} A new color object for a specific source. For example:
 * { source: 'rgb', r: 1, g: 2, b:3, a:0 }
 */
function dataToColors( oldColors, { source, valueKey, value } ) {
	if ( source === 'hex' ) {
		return {
			source,
			[ source ]: value,
		};
	}
	return {
		source,
		...{ ...oldColors[ source ], ...{ [ valueKey ]: value } },
	};
}

export default function ColorPicker( {
	color = '0071a1',
	className,
	disableAlpha,
	oldHue,
	onChangeComplete = noop,
} ) {
	const initialColor = colorToState( color );
	const [ colors, setColors ] = useState( {
		...initialColor,
		draftHex: toLowerCase( initialColor.hex ),
		draftRgb: initialColor.rgb,
		draftHsl: initialColor.hsl,
	} );
	const { hex, hsl, hsv, rgb, draftHex, draftHsl, draftRgb } = colors;

	const classes = classnames( className, {
		'components-color-picker': true,
		'is-alpha-disabled': disableAlpha,
		'is-alpha-enabled': ! disableAlpha,
	} );

	function commitValues( data ) {
		if ( isValidColor( data ) ) {
			const newColors = colorToState( data, data.h || oldHue );
			setColors( {
				...newColors,
				draftHex: toLowerCase( newColors.hex ),
				draftHsl: newColors.hsl,
				draftRgb: newColors.rgb,
			} );

			debounce( partial( onChangeComplete, newColors ), 100 );
		}
	}

	function resetDraftValues() {
		setColors( {
			...colors,
			draftHex: hex,
			draftHsl: hsl,
			draftRgb: rgb,
		} );
	}

	function setDraftValues( data ) {
		switch ( data.source ) {
			case 'hex':
				setColors( {
					...colors,
					draftHex: toLowerCase( data.hex ),
				} );
				break;
			case 'rgb':
				setColors( {
					...colors,
					draftRgb: data,
				} );
				break;
			case 'hsl':
				setColors( {
					...colors,
					draftHsl: data,
				} );
				break;
		}
	}

	function handleInputChange( data ) {
		switch ( data.state ) {
			case 'reset':
				resetDraftValues();
				break;
			case 'commit':
				const newColors = dataToColors( colors, data );
				if ( ! isValueEmpty( newColors ) ) {
					commitValues( newColors );
				}
				break;
			case 'draft':
				setDraftValues( dataToColors( colors, data ) );
				break;
		}
	}

	return (
		<div className={ classes }>
			<div className="components-color-picker__saturation">
				<Saturation hsl={ hsl } hsv={ hsv } onChange={ commitValues } />
			</div>

			<div className="components-color-picker__body">
				<div className="components-color-picker__controls">
					<div className="components-color-picker__swatch">
						<div
							className="components-color-picker__active"
							style={ {
								backgroundColor:
									colors.color && colors.color.toRgbString(),
							} }
						/>
					</div>

					<div className="components-color-picker__toggles">
						<Hue hsl={ hsl } onChange={ commitValues } />
						{ disableAlpha ? null : (
							<Alpha
								rgb={ rgb }
								hsl={ hsl }
								onChange={ commitValues }
							/>
						) }
					</div>
				</div>

				<Inputs
					rgb={ draftRgb }
					hsl={ draftHsl }
					hex={ draftHex }
					onChange={ handleInputChange }
					disableAlpha={ disableAlpha }
				/>
			</div>
		</div>
	);
}
