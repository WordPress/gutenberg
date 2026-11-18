import { useCallback, useState } from '@wordpress/element';

type Props< T > = {
	defaultValue?: T;
	value?: T;
	onChange?: ( value: T, ...args: any[] ) => void;
};

/**
 * Keeps track of a value that can be either controlled (via the `value` prop)
 * or uncontrolled (via the `defaultValue` prop).
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

	const uncontrolledSetValue = useCallback(
		( nextValue: T, ...args: any[] ) => {
			setState( nextValue );
			onChange?.( nextValue, ...args );
		},
		[ onChange ]
	);

	let setValue: typeof onChange;
	if ( hasValue && typeof onChange === 'function' ) {
		// Controlled mode.
		setValue = onChange;
	} else if ( ! hasValue && typeof onChange === 'function' ) {
		// Uncontrolled mode, plus forwarding to the onChange prop.
		setValue = uncontrolledSetValue;
	} else {
		// Uncontrolled mode, only update internal state.
		setValue = setState;
	}

	return [ value, setValue ] as const;
}
