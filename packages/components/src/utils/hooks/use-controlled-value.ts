/**
 * External dependencies
 */
import { isNil } from 'lodash';

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
 * @param  props
 * @param  props.defaultValue
 * @param  props.value
 * @param  props.onChange
 * @return The controlled value and the value setter.
 */
export function useControlledValue< T >( {
	defaultValue,
	onChange,
	value: valueProp,
}: Props< T > ): [ T | undefined, ( value: T ) => void ] {
	const hasValue = ! isNil( valueProp );
	const initialValue = hasValue ? valueProp : defaultValue;
	const [ state, setState ] = useState( initialValue );
	const value = hasValue ? valueProp : state;
	const setValue = hasValue && ! isNil( onChange ) ? onChange : setState;

	return [ value, setValue ];
}
