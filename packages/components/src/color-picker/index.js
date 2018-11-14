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
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Alpha from './alpha';
import Hue from './hue';
import Inputs from './inputs';
import Saturation from './saturation';
import { colorToState, simpleCheckForValidColor } from './utils';

export default class ColorPicker extends Component {
	constructor( { color = '0071a1' } ) {
		super( ...arguments );
		const colors = colorToState( color );
		this.state = {
			...colors,
			draftValues: {
				hex: colors.hex,
				hsl: colors.hsl,
				rgb: colors.rgb,
			},
		};
		this.handleChange = this.handleChange.bind( this );
		this.handleInputChange = this.handleInputChange.bind( this );
	}

	handleChange( data ) {
		const { oldHue, onChangeComplete = noop } = this.props;
		const isValidColor = simpleCheckForValidColor( data );
		if ( isValidColor ) {
			const colors = colorToState( data, data.h || oldHue );
			this.setState( {
				...colors,
				draftValues: {
					hex: colors.hex,
					hsl: colors.hsl,
					rgb: colors.rgb,
				},
			},
			debounce( partial( onChangeComplete, colors ), 100 )
			);
		}
	}

	handleInputChange( data ) {
		if ( data.state === 'commit' ) {
			this.handleChange( data );
		} else {
			this.setState( {
				draftValues: {
					hex: data.hex,
					hsl: data.hsl,
					rgb: data.rgb,
				},
			} );
		}
	}

	render() {
		const { className, disableAlpha } = this.props;
		const { color, hex, hsl, hsv, rgb } = this.state;
		const classes = classnames( className, {
			'components-color-picker': true,
			'is-alpha-disabled': disableAlpha,
			'is-alpha-enabled': ! disableAlpha,
		} );

		return (
			<div className={ classes }>
				<div className="components-color-picker__saturation">
					<Saturation
						hsl={ hsl }
						hsv={ hsv }
						onChange={ this.handleChange }
					/>
				</div>

				<div className="components-color-picker__body">
					<div className="components-color-picker__controls">
						<div className="components-color-picker__swatch">
							<div
								className="components-color-picker__active"
								style={ {
									backgroundColor: color && color.toRgbString(),
								} }
							/>
						</div>

						<div className="components-color-picker__toggles">
							<Hue hsl={ hsl } onChange={ this.handleChange } />
							{ disableAlpha ? null : (
								<Alpha
									rgb={ rgb }
									hsl={ hsl }
									onChange={ this.handleChange }
								/>
							) }
						</div>
					</div>

					<Inputs
						rgb={ rgb }
						hsl={ hsl }
						hex={ hex }
						onChange={ this.handleInputChange }
						disableAlpha={ disableAlpha }
					/>
				</div>
			</div>
		);
	}
}
