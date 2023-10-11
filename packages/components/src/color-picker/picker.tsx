/**
 * External dependencies
 */
import { RgbStringColorPicker, RgbaStringColorPicker } from 'react-colorful';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useMemo, useEffect, useRef } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { PickerProps } from './types';

export const Picker = ( {
	color,
	enableAlpha,
	onChange,
	onDragStart,
	onDragEnd,
	containerEl,
}: PickerProps ) => {
	const Component = enableAlpha
		? RgbaStringColorPicker
		: RgbStringColorPicker;
	const rgbColor = useMemo( () => color.toRgbString(), [ color ] );

	const isDragging = useRef( false );
	const leftWhileDragging = useRef( false );
	useEffect( () => {
		if ( ! containerEl ) {
			return;
		}
		const interactiveElements = [
			containerEl.querySelector( '.react-colorful__saturation' ),
			containerEl.querySelector( '.react-colorful__hue' ),
			containerEl.querySelector( '.react-colorful__alpha' ),
		].filter( ( el ) => !! el ) as Element[];

		if ( interactiveElements.length === 0 ) {
			return;
		}

		const doc = containerEl.ownerDocument;

		const onPointerUp: EventListener = ( event ) => {
			isDragging.current = false;
			leftWhileDragging.current = false;
			onDragEnd?.( event as MouseEvent );
		};

		const onPointerDown: EventListener = ( event ) => {
			isDragging.current = true;
			onDragStart?.( event as MouseEvent );
		};

		const onPointerLeave: EventListener = () => {
			leftWhileDragging.current = isDragging.current;
		};

		const onPointerEnter: EventListener = ( event ) => {
			const noPointerButtonsArePressed =
				( event as PointerEvent ).buttons === 0;

			if ( leftWhileDragging.current && noPointerButtonsArePressed ) {
				onPointerUp( event );
			}
		};

		interactiveElements.forEach( ( el ) =>
			el.addEventListener( 'pointerdown', onPointerDown )
		);
		doc.addEventListener( 'pointerup', onPointerUp );
		doc.addEventListener( 'pointerenter', onPointerEnter );
		doc.addEventListener( 'pointerleave', onPointerLeave );

		return () => {
			interactiveElements.forEach( ( el ) =>
				el.removeEventListener( 'pointerdown', onPointerDown )
			);
			doc.removeEventListener( 'pointerup', onPointerUp );
			doc.removeEventListener( 'pointerenter', onPointerEnter );
			doc.removeEventListener( 'pointerleave', onPointerUp );
		};
	}, [ onDragStart, onDragEnd, containerEl ] );

	return (
		<Component
			color={ rgbColor }
			onChange={ ( nextColor ) => {
				onChange( colord( nextColor ) );
			} }
		/>
	);
};
