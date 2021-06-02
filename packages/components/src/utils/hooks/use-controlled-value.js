/**
 * External dependencies
 */
import { isNil } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Simplified and improved implementation of useControlledState.
 *
 * @template T
 * @param {Object} props
 * @param {T} [props.defaultValue]
 * @param {T} [props.value]
 * @param {(value: T) => void} [props.onChange]
 * @return {[T|undefined, (value: T) => void]} The controlled value and the value setter.
 */
export function useControlledValue( {
	defaultValue,
	onChange,
	value: valueProp,
} ) {
	const hasValue = ! isNil( valueProp );
	const initialValue = hasValue ? valueProp : defaultValue;
	const [ state, setState ] = useState( initialValue );
	const value = hasValue ? valueProp : state;
	const setValue = hasValue && ! isNil( onChange ) ? onChange : setState;

	return [ value, setValue ];
}

export default useControlledValue;
