import { useEffect, useRef, useState } from '@wordpress/element';
import type { InputProps } from './types';

function toValueText(
	value: InputProps[ 'value' ] | InputProps[ 'defaultValue' ]
) {
	return value === undefined || value === null ? '' : String( value );
}

/**
 * Returns an input's current value as text, in both controlled and
 * uncontrolled mode.
 *
 * An uncontrolled input's value follows user edits and form resets, but not a
 * value set directly on the element, which fires no event.
 *
 * @param props               The input's props that affect its value.
 * @param props.value         The controlled value.
 * @param props.defaultValue  The initial uncontrolled value.
 * @param props.onValueChange The input's value change handler.
 * @param props.enabled       Whether to track the uncontrolled value.
 */
export function useInputValue( {
	value,
	defaultValue,
	onValueChange,
	enabled = true,
}: Pick< InputProps, 'value' | 'defaultValue' | 'onValueChange' > & {
	enabled?: boolean;
} ) {
	const tracksValue = enabled && value === undefined;

	const ref = useRef< HTMLInputElement >( null );
	const [ uncontrolledValue, setUncontrolledValue ] = useState( () =>
		toValueText( defaultValue )
	);

	useEffect( () => {
		const input = ref.current;
		if ( ! tracksValue || ! input ) {
			return;
		}
		setUncontrolledValue( input.value );

		// A form reset restores the default value without an input event.
		const onReset = ( event: Event ) => {
			if ( event.target !== input.form ) {
				return;
			}
			// `reset` fires before the form restores its values.
			setTimeout( () => setUncontrolledValue( input.value ) );
		};
		const { ownerDocument } = input;
		ownerDocument.addEventListener( 'reset', onReset );
		return () => ownerDocument.removeEventListener( 'reset', onReset );
	}, [ tracksValue ] );

	const handleValueChange: InputProps[ 'onValueChange' ] = (
		nextValue,
		eventDetails
	) => {
		if ( tracksValue ) {
			setUncontrolledValue( nextValue );
		}
		onValueChange?.( nextValue, eventDetails );
	};

	return {
		ref,
		value: tracksValue ? uncontrolledValue : toValueText( value ),
		onValueChange: handleValueChange,
	};
}
