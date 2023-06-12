/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

type Props< T > = {
	defaultValue?: T;
	value?: T;
	onChange?: ( value: T ) => void;
};

/**
 * Simplified and improved implementation of useControlledState.
 *
 * @param props
 * @param props.defaultValue
 * @param props.value
 * @param props.onChange
 * @return The controlled value and the value setter.
 */
export function useControlledValue< T >( {
	defaultValue,
	onChange,
	value: valueProp,
}: Props< T > ) {
	const hasValue = typeof valueProp !== 'undefined';
	const initialValue = hasValue ? valueProp : defaultValue;
	const [ state, setState ] = useState( initialValue );
	const value = hasValue ? valueProp : state;

	let setValue: ( nextValue: T ) => void;
	if ( hasValue && typeof onChange === 'function' ) {
		setValue = onChange;
	} else if ( ! hasValue && typeof onChange === 'function' ) {
		setValue = ( nextValue ) => {
			onChange( nextValue );
			setState( nextValue );
		};
	} else {
		setValue = setState;
	}

	return [ value, setValue as typeof setState ] as const;
}
