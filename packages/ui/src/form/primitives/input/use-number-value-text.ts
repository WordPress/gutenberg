import { useEffect, useRef, useState } from '@wordpress/element';
import type { InputProps } from './types';

function toValueText(
	value: InputProps[ 'value' ] | InputProps[ 'defaultValue' ]
) {
	return value === undefined || value === null ? '' : String( value );
}

/**
 * VoiceOver reads a number input with a `max` as a percentage of its range,
 * unless it has an `aria-valuetext`.
 *
 * @param props The input's props that affect its value text.
 */
export function useNumberValueText(
	props: Pick<
		InputProps,
		'type' | 'value' | 'defaultValue' | 'aria-valuetext' | 'onValueChange'
	>
) {
	const {
		type,
		value,
		defaultValue,
		'aria-valuetext': ariaValueText,
		onValueChange,
	} = props;
	const needsValueText = type === 'number' && ariaValueText === undefined;
	const tracksValue = needsValueText && value === undefined;

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

	const valueText = tracksValue ? uncontrolledValue : toValueText( value );

	return {
		ref,
		'aria-valuetext': needsValueText
			? valueText || undefined
			: ariaValueText,
		onValueChange: handleValueChange,
	};
}
