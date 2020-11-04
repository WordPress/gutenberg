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
import { useState, useEffect, useRef } from '@wordpress/element';
import { TAB } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { calculateAlphaChange } from './utils';
import KeyboardShortcuts from '../keyboard-shortcuts';

export default function Alpha( { rgb, hsl, onChange = noop } ) {
	const [ mouseDown, setMouseDown ] = useState( false );
	const container = useRef();

	const rgbString = `${ rgb.r },${ rgb.g },${ rgb.b }`;
	const gradient = {
		background: `linear-gradient(to right, rgba(${ rgbString }, 0) 0%, rgba(${ rgbString }, 1) 100%)`,
	};
	const pointerLocation = { left: `${ rgb.a * 100 }%` };

	const handleChange = ( e ) => {
		const change = calculateAlphaChange( e, { hsl }, container.current );
		if ( change ) {
			onChange( change, e );
		}
	};

	const handleMouseDown = () => {
		window.addEventListener( 'mousemove', handleChange );
		window.addEventListener( 'mouseup', handleMouseUp );
	};

	const handleMouseUp = () => {
		setMouseDown( false );
	};

	const unbindEventListeners = () => {
		window.removeEventListener( 'mousemove', handleChange );
		window.removeEventListener( 'mouseup', handleMouseUp );
	};

	const preventKeyEvents = ( event ) => {
		if ( event.keyCode === TAB ) {
			return;
		}
		event.preventDefault();
	};

	useEffect( () => {
		if ( mouseDown ) {
			handleMouseDown();
		} else {
			unbindEventListeners();
		}

		return unbindEventListeners;
	}, [ mouseDown ] );

	const increase = ( amount = 0.01 ) => {
		amount = parseInt( amount * 100, 10 );
		const change = {
			h: hsl.h,
			s: hsl.s,
			l: hsl.l,
			a: ( parseInt( hsl.a * 100, 10 ) + amount ) / 100,
			source: 'rgb',
		};
		onChange( change );
	};

	const decrease = ( amount = 0.01 ) => {
		const intValue =
			parseInt( hsl.a * 100, 10 ) - parseInt( amount * 100, 10 );
		const change = {
			h: hsl.h,
			s: hsl.s,
			l: hsl.l,
			a: hsl.a <= amount ? 0 : intValue / 100,
			source: 'rgb',
		};
		onChange( change );
	};

	const shortcuts = {
		up: () => increase(),
		right: () => increase(),
		'shift+up': () => increase( 0.1 ),
		'shift+right': () => increase( 0.1 ),
		pageup: () => increase( 0.1 ),
		end: () => increase( 1 ),
		down: () => decrease(),
		left: () => decrease(),
		'shift+down': () => decrease( 0.1 ),
		'shift+left': () => decrease( 0.1 ),
		pagedown: () => decrease( 0.1 ),
		home: () => decrease( 1 ),
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
					ref={ container }
					onMouseDown={ () => setMouseDown( true ) }
					onTouchMove={ handleChange }
					onTouchStart={ handleChange }
				>
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
						onKeyDown={ preventKeyEvents }
					/>
				</div>
				{ /* eslint-enable jsx-a11y/no-static-element-interactions */ }
			</div>
		</KeyboardShortcuts>
	);
}
