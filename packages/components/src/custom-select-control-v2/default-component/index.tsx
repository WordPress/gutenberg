/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * Internal dependencies
 */
import _CustomSelect from '../custom-select';
import type { CustomSelectProps } from '../types';

function CustomSelect( props: CustomSelectProps ) {
	const { defaultValue, onChange, value, ...restProps } = props;
	// Forward props + store from v2 implementation
	const store = Ariakit.useSelectStore( {
		setValue: ( nextValue ) => onChange?.( nextValue ),
		defaultValue,
		value,
	} );

	return <_CustomSelect { ...restProps } store={ store } />;
}

export default CustomSelect;
