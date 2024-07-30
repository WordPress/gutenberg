/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import _CustomSelect from './custom-select';
import type { CustomSelectProps } from './types';
import type { WordPressComponentProps } from '../context';
import Item from './item';

function UnforwardedCustomSelectControlV2(
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

/** The main description. */
export const CustomSelectControlV2 = Object.assign(
	forwardRef( UnforwardedCustomSelectControlV2 ),
	{
		/** The subcomponent description. */
		Item,
	}
);

export default CustomSelectControlV2;
