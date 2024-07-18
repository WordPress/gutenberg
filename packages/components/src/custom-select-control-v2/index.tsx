/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
/**
 * Internal dependencies
 */
import _CustomSelect from './custom-select';
import type { CustomSelectProps } from './types';
import type { WordPressComponentProps } from '../context';
import Item from './item';

function CustomSelectControlV2(
	props: WordPressComponentProps< CustomSelectProps, 'button', false >
) {
	const { defaultValue, onChange, value, ...restProps } = props;
	// Forward props + store from v2 implementation
	const store = Ariakit.useSelectStore( {
		setValue: ( nextValue ) => onChange?.( nextValue ),
		defaultValue,
		value,
	} );

	return <_CustomSelect { ...restProps } store={ store } />;
}

CustomSelectControlV2.Item = Item;

export default CustomSelectControlV2;
