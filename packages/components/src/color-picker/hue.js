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
import { compose, pure, withInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import {
	TAB,
	UP,
	DOWN,
	RIGHT,
	LEFT,
	PAGEUP,
	PAGEDOWN,
	HOME,
	END,
} from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { calculateHueChange } from './utils';
import { VisuallyHidden } from '../visually-hidden';

export class Hue extends Component {
	constructor() {
		super( ...arguments );

		this.container = createRef();
		this.increase = this.increase.bind( this );
		this.decrease = this.decrease.bind( this );
		this.handleChange = this.handleChange.bind( this );
		this.handleMouseDown = this.handleMouseDown.bind( this );
		this.handleMouseUp = this.handleMouseUp.bind( this );
		this.handleKeyDown = this.handleKeyDown.bind( this );
	}

	componentWillUnmount() {
		this.unbindEventListeners();
	}

	increase( amount = 1 ) {
		const { hsl, onChange = noop } = this.props;
		const change = {
			h: hsl.h + amount >= 359 ? 359 : hsl.h + amount,
			s: hsl.s,
			l: hsl.l,
			a: hsl.a,
			source: 'rgb',
		};
		onChange( change );
	}

	decrease( amount = 1 ) {
		const { hsl, onChange = noop } = this.props;
		const change = {
			h: hsl.h <= amount ? 0 : hsl.h - amount,
			s: hsl.s,
			l: hsl.l,
			a: hsl.a,
			source: 'rgb',
		};
		onChange( change );
	}

	handleChange( e ) {
		const { onChange = noop } = this.props;
		const change = calculateHueChange(
			e,
			this.props,
			this.container.current
		);
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

	unbindEventListeners() {
		window.removeEventListener( 'mousemove', this.handleChange );
		window.removeEventListener( 'mouseup', this.handleMouseUp );
	}

	handleKeyDown( event ) {
		const { keyCode, shiftKey } = event;
		const shortcuts = {
			[ UP ]: () => this.increase( shiftKey ? 10 : 1 ),
			[ RIGHT ]: () => this.increase( shiftKey ? 10 : 1 ),
			[ PAGEUP ]: () => this.increase( 10 ),
			[ END ]: () => this.increase( 359 ),
			[ DOWN ]: () => this.decrease( shiftKey ? 10 : 1 ),
			[ LEFT ]: () => this.decrease( shiftKey ? 10 : 1 ),
			[ PAGEDOWN ]: () => this.decrease( 10 ),
			[ HOME ]: () => this.decrease( 359 ),
		};

		for ( const code in shortcuts ) {
			if ( code === String( keyCode ) ) {
				shortcuts[ keyCode ]();
			}
		}

		if ( keyCode !== TAB ) {
			event.preventDefault();
		}
	}

	render() {
		const { hsl = {}, instanceId } = this.props;
		const pointerLocation = { left: `${ ( hsl.h * 100 ) / 360 }%` };

		return (
			<div className="components-color-picker__hue">
				<div className="components-color-picker__hue-gradient" />
				{ /* eslint-disable jsx-a11y/no-static-element-interactions */ }
				<div
					className="components-color-picker__hue-bar"
					ref={ this.container }
					onMouseDown={ this.handleMouseDown }
					onTouchMove={ this.handleChange }
					onTouchStart={ this.handleChange }
				>
					<div
						tabIndex="0"
						role="slider"
						aria-valuemax="1"
						aria-valuemin="359"
						aria-valuenow={ hsl.h }
						aria-orientation="horizontal"
						aria-label={ __(
							'Hue value in degrees, from 0 to 359.'
						) }
						aria-describedby={ `components-color-picker__hue-description-${ instanceId }` }
						className="components-color-picker__hue-pointer"
						style={ pointerLocation }
						onKeyDown={ this.handleKeyDown }
					/>
					<VisuallyHidden
						as="p"
						id={ `components-color-picker__hue-description-${ instanceId }` }
					>
						{ __( 'Move the arrow left or right to change hue.' ) }
					</VisuallyHidden>
				</div>
				{ /* eslint-enable jsx-a11y/no-static-element-interactions */ }
			</div>
		);
	}
}

export default compose( pure, withInstanceId )( Hue );
