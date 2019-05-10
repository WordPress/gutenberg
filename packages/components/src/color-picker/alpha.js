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
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { TAB } from '@wordpress/keycodes';
import { pure } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { calculateAlphaChange } from './utils';
import KeyboardShortcuts from '../keyboard-shortcuts';

export class Alpha extends Component {
	constructor() {
		super( ...arguments );

		this.container = createRef();
		this.increase = this.increase.bind( this );
		this.decrease = this.decrease.bind( this );
		this.handleChange = this.handleChange.bind( this );
		this.handleMouseDown = this.handleMouseDown.bind( this );
		this.handleMouseUp = this.handleMouseUp.bind( this );
	}

	componentWillUnmount() {
		this.unbindEventListeners();
	}

	increase( amount = 0.01 ) {
		const { hsl, onChange = noop } = this.props;
		amount = parseInt( amount * 100, 10 );
		const change = {
			h: hsl.h,
			s: hsl.s,
			l: hsl.l,
			a: ( parseInt( hsl.a * 100, 10 ) + amount ) / 100,
			source: 'rgb',
		};
		onChange( change );
	}

	decrease( amount = 0.01 ) {
		const { hsl, onChange = noop } = this.props;
		const intValue = parseInt( hsl.a * 100, 10 ) - parseInt( amount * 100, 10 );
		const change = {
			h: hsl.h,
			s: hsl.s,
			l: hsl.l,
			a: hsl.a <= amount ? 0 : intValue / 100,
			source: 'rgb',
		};
		onChange( change );
	}

	handleChange( e ) {
		const { onChange = noop } = this.props;
		const change = calculateAlphaChange( e, this.props, this.container.current );
		if ( change ) {
			onChange( change, e );
		}
	}

	handleMouseDown( e ) {
		this.handleChange( e );
		window.addEventListener( 'mousemove', this.handleChange );
		window.addEventListener( 'mouseup', this.handleMouseUp );
	}

	handleMouseUp() {
		this.unbindEventListeners();
	}

	preventKeyEvents( event ) {
		if ( event.keyCode === TAB ) {
			return;
		}
		event.preventDefault();
	}

	unbindEventListeners() {
		window.removeEventListener( 'mousemove', this.handleChange );
		window.removeEventListener( 'mouseup', this.handleMouseUp );
	}

	render() {
		const { rgb } = this.props;
		const rgbString = `${ rgb.r },${ rgb.g },${ rgb.b }`;
		const gradient = {
			background: `linear-gradient(to right, rgba(${ rgbString }, 0) 0%, rgba(${ rgbString }, 1) 100%)`,
		};
		const pointerLocation = { left: `${ rgb.a * 100 }%` };

		const shortcuts = {
			up: () => this.increase(),
			right: () => this.increase(),
			'shift+up': () => this.increase( 0.1 ),
			'shift+right': () => this.increase( 0.1 ),
			pageup: () => this.increase( 0.1 ),
			end: () => this.increase( 1 ),
			down: () => this.decrease(),
			left: () => this.decrease(),
			'shift+down': () => this.decrease( 0.1 ),
			'shift+left': () => this.decrease( 0.1 ),
			pagedown: () => this.decrease( 0.1 ),
			home: () => this.decrease( 1 ),
		};

		return (
			<KeyboardShortcuts shortcuts={ shortcuts }>
				<div className="components-color-picker__alpha">
					<div
						className="components-color-picker__alpha-gradient"
						style={ gradient }
					/>
					{ /* eslint-disable jsx-a11y/no-static-element-interactions */ }
					<div
						className="components-color-picker__alpha-bar"
						ref={ this.container }
						onMouseDown={ this.handleMouseDown }
						onTouchMove={ this.handleChange }
						onTouchStart={ this.handleChange }>
						<div
							tabIndex="0"
							role="slider"
							aria-valuemax="1"
							aria-valuemin="0"
							aria-valuenow={ rgb.a }
							aria-orientation="horizontal"
							aria-label={ __(
								'Alpha value, from 0 (transparent) to 1 (fully opaque).'
							) }
							className="components-color-picker__alpha-pointer"
							style={ pointerLocation }
							onKeyDown={ this.preventKeyEvents }
						/>
					</div>
					{ /* eslint-enable jsx-a11y/no-static-element-interactions */ }
				</div>
			</KeyboardShortcuts>
		);
	}
}

export default pure( Alpha );
