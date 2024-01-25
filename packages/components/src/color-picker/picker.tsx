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

/**
 * Track the start and the end of drag pointer events related to controlling
 * the picker's saturation / hue / alpha, and fire the corresponding callbacks.
 * This is particularly useful to implement synergies like the one with the
 * `Popover` component, where a pointer events "trap" is rendered while
 * the user is dragging the pointer to avoid potential interference with iframe
 * elements.
 *
 * @param props
 * @param props.containerEl
 * @param props.onDragStart
 * @param props.onDragEnd
 */
const useOnPickerDrag = ( {
	containerEl,
	onDragStart,
	onDragEnd,
}: Pick< PickerProps, 'containerEl' | 'onDragStart' | 'onDragEnd' > ) => {
	const isDragging = useRef( false );
	const leftWhileDragging = useRef( false );
	useEffect( () => {
		if ( ! containerEl || ( ! onDragStart && ! onDragEnd ) ) {
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

		// Try to detect if the user released the pointer while away from the
		// current window. If the check is successfull, the dragEnd callback will
		// called as soon as the pointer re-enters the window (better late than never)
		const onPointerEnter: EventListener = ( event ) => {
			const noPointerButtonsArePressed =
				( event as PointerEvent ).buttons === 0;

			if ( leftWhileDragging.current && noPointerButtonsArePressed ) {
				onPointerUp( event );
			}
		};

		// The pointerdown event is added on the interactive elements,
		// while the remaining events are added on the document object since
		// the pointer wouldn't necessarily be hovering the initial interactive
		// element at that point.
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
};

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

	useOnPickerDrag( { containerEl, onDragStart, onDragEnd } );

	return (
		<Component
			color={ rgbColor }
			onChange={ ( nextColor ) => {
				onChange( colord( nextColor ) );
			} }
		/>
	);
};
