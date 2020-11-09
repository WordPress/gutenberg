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
import { clamp, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import { TAB } from '@wordpress/keycodes';
import { useThrottle, useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { calculateSaturationChange } from './utils';
import Button from '../button';
import KeyboardShortcuts from '../keyboard-shortcuts';
import VisuallyHidden from '../visually-hidden';

export default function Saturation( { hsv, hsl, onChange = noop } ) {
	const container = useRef();
	const instanceId = useInstanceId( Saturation );
	const [ mouseDown, setMouseDown ] = useState( false );

	const pointerLocation = {
		top: `${ -hsv.v + 100 }%`,
		left: `${ hsv.s }%`,
	};

	const throttledOnChange = useThrottle( onChange, 50 );

	function saturate( amount = 0.01 ) {
		const intSaturation = clamp(
			hsv.s + Math.round( amount * 100 ),
			0,
			100
		);
		const change = {
			h: hsv.h,
			s: intSaturation,
			v: hsv.v,
			a: hsv.a,
			source: 'rgb',
		};

		onChange( change );
	}

	function brighten( amount = 0.01 ) {
		const intValue = clamp( hsv.v + Math.round( amount * 100 ), 0, 100 );
		const change = {
			h: hsv.h,
			s: hsv.s,
			v: intValue,
			a: hsv.a,
			source: 'rgb',
		};

		onChange( change );
	}

	function handleChange( e ) {
		const change = calculateSaturationChange(
			e,
			{ hsl },
			container.current
		);
		throttledOnChange( change, e );
	}

	function handleMouseUp() {
		setMouseDown( false );
	}

	function preventKeyEvents( e ) {
		if ( e.keyCode === TAB ) {
			return;
		}
		e.preventDefault();
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

	const shortcuts = {
		up: () => brighten(),
		'shift+up': () => brighten( 0.1 ),
		pageup: () => brighten( 1 ),
		down: () => brighten( -0.01 ),
		'shift+down': () => brighten( -0.1 ),
		pagedown: () => brighten( -1 ),
		right: () => saturate(),
		'shift+right': () => saturate( 0.1 ),
		end: () => saturate( 1 ),
		left: () => saturate( -0.01 ),
		'shift+left': () => saturate( -0.1 ),
		home: () => saturate( -1 ),
	};

	/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
	return (
		<KeyboardShortcuts shortcuts={ shortcuts }>
			<div
				style={ { background: `hsl(${ hsl.h },100%, 50%)` } }
				className="components-color-picker__saturation-color"
				ref={ container }
				onMouseDown={ () => setMouseDown( true ) }
				onTouchMove={ handleChange }
				onTouchStart={ handleChange }
				role="application"
			>
				<div className="components-color-picker__saturation-white" />
				<div className="components-color-picker__saturation-black" />
				<Button
					aria-label={ __( 'Choose a shade' ) }
					aria-describedby={ `color-picker-saturation-${ instanceId }` }
					className="components-color-picker__saturation-pointer"
					style={ pointerLocation }
					onKeyDown={ preventKeyEvents }
				/>
				<VisuallyHidden
					id={ `color-picker-saturation-${ instanceId }` }
				>
					{ __(
						'Use your arrow keys to change the base color. Move up to lighten the color, down to darken, left to decrease saturation, and right to increase saturation.'
					) }
				</VisuallyHidden>
			</div>
		</KeyboardShortcuts>
	);
	/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
}
