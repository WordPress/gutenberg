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
import { useInstanceId } from '@wordpress/compose';
import { TAB } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { calculateHueChange } from './utils';
import KeyboardShortcuts from '../keyboard-shortcuts';
import VisuallyHidden from '../visually-hidden';

export default function Hue( { hsl, onChange = noop } ) {
	const [ mouseDown, setMouseDown ] = useState( false );
	const container = useRef();

	const instanceId = useInstanceId( Hue );

	const pointerLocation = { left: `${ ( hsl.h * 100 ) / 360 }%` };

	function handleChange( e ) {
		const change = calculateHueChange( e, { hsl }, container.current );
		if ( change ) {
			onChange( change, e );
		}
	}

	function handleMouseUp() {
		setMouseDown( false );
	}

	function preventKeyEvents( event ) {
		if ( event.keyCode === TAB ) {
			return;
		}
		event.preventDefault();
	}

	useEffect( () => {
		const { ownerDocument } = container.current;

		if ( ! mouseDown ) {
			return;
		}

		ownerDocument.addEventListener( 'mousemove', handleChange );
		ownerDocument.addEventListener( 'mouseup', handleMouseUp );

		return () => {
			ownerDocument.removeEventListener( 'mousemove', handleChange );
			ownerDocument.removeEventListener( 'mouseup', handleMouseUp );
		};
	}, [ mouseDown ] );

	function increase( amount = 1 ) {
		const change = {
			h: hsl.h + amount >= 359 ? 359 : hsl.h + amount,
			s: hsl.s,
			l: hsl.l,
			a: hsl.a,
			source: 'rgb',
		};
		onChange( change );
	}

	function decrease( amount = 1 ) {
		const change = {
			h: hsl.h <= amount ? 0 : hsl.h - amount,
			s: hsl.s,
			l: hsl.l,
			a: hsl.a,
			source: 'rgb',
		};
		onChange( change );
	}

	const shortcuts = {
		up: () => increase(),
		right: () => increase(),
		'shift+up': () => increase( 10 ),
		'shift+right': () => increase( 10 ),
		pageup: () => increase( 10 ),
		end: () => increase( 359 ),
		down: () => decrease(),
		left: () => decrease(),
		'shift+down': () => decrease( 10 ),
		'shift+left': () => decrease( 10 ),
		pagedown: () => decrease( 10 ),
		home: () => decrease( 359 ),
	};
	return (
		<KeyboardShortcuts shortcuts={ shortcuts }>
			<div className="components-color-picker__hue">
				<div className="components-color-picker__hue-gradient" />
				{ /* eslint-disable jsx-a11y/no-static-element-interactions */ }
				<div
					className="components-color-picker__hue-bar"
					ref={ container }
					onMouseDown={ () => setMouseDown( true ) }
					onTouchMove={ handleChange }
					onTouchStart={ handleChange }
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
						onKeyDown={ preventKeyEvents }
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
		</KeyboardShortcuts>
	);
}
