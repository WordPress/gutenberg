/**
 * External dependencies
 */
import type { FocusEventHandler } from 'react';

/**
 * WordPress dependencies
 */
import {
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { InputChangeCallback } from './types';

/**
 * Gets a CSS cursor value based on a drag direction.
 *
 * @param dragDirection The drag direction.
 * @return  The CSS cursor value.
 */
export function getDragCursor( dragDirection: string ): string {
	let dragCursor = 'ns-resize';

	switch ( dragDirection ) {
		case 'n':
		case 's':
			dragCursor = 'ns-resize';
			break;

		case 'e':
		case 'w':
			dragCursor = 'ew-resize';
			break;
	}

	return dragCursor;
}

/**
 * Custom hook that renders a drag cursor when dragging.
 *
 * @param {boolean} isDragging    The dragging state.
 * @param {string}  dragDirection The drag direction.
 *
 * @return {string} The CSS cursor value.
 */
export function useDragCursor(
	isDragging: boolean,
	dragDirection: string
): string {
	const dragCursor = getDragCursor( dragDirection );

	useEffect( () => {
		if ( isDragging ) {
			document.documentElement.style.cursor = dragCursor;
		} else {
			// @ts-expect-error
			document.documentElement.style.cursor = null;
		}
	}, [ isDragging, dragCursor ] );

	return dragCursor;
}

export function useDraft( props: {
	value: string | undefined;
	onBlur?: FocusEventHandler;
	onChange: InputChangeCallback;
} ) {
	const previousValueRef = useRef( props.value );
	const [ draft, setDraft ] = useState< {
		value?: string;
		isStale?: boolean;
	} >( {} );
	const value = draft.value !== undefined ? draft.value : props.value;

	// Determines when to discard the draft value to restore controlled status.
	// To do so, it tracks the previous value and marks the draft value as stale
	// after each render.
	useLayoutEffect( () => {
		const { current: previousValue } = previousValueRef;
		previousValueRef.current = props.value;
		if ( draft.value !== undefined && ! draft.isStale ) {
			setDraft( { ...draft, isStale: true } );
		} else if ( draft.isStale && props.value !== previousValue ) {
			setDraft( {} );
		}
	}, [ props.value, draft ] );

	const onChange: InputChangeCallback = ( nextValue, extra ) => {
		// Mutates the draft value to avoid an extra effect run.
		setDraft( ( current ) =>
			Object.assign( current, { value: nextValue, isStale: false } )
		);
		props.onChange( nextValue, extra );
	};
	const onBlur: FocusEventHandler = ( event ) => {
		setDraft( {} );
		props.onBlur?.( event );
	};

	return { value, onBlur, onChange };
}
