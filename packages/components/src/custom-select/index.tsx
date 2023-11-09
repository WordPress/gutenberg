/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * Internal dependencies
 */
// import { type CustomSelectProps } from './types';
import { CustomSelectButton, CustomSelectPopover } from './styles';
import CustomSelectItem from './custom-select-item';
import type { CustomSelectProps } from './types';

function CustomSelect( props: CustomSelectProps ) {
	const { children, defaultValue, label, onChange } = props;

	const store = Ariakit.useSelectStore( {
		setValue: ( nextValue ) => onChange?.( nextValue ),
		defaultValue,
	} );

	const { value } = store.useState();

	return (
		<>
			<Ariakit.SelectLabel store={ store }>{ label }</Ariakit.SelectLabel>
			<CustomSelectButton store={ store }>
				{ typeof defaultValue === 'object' ? defaultValue : value }
			</CustomSelectButton>
			<CustomSelectPopover gutter={ 4 } sameWidth store={ store }>
				{ children }
			</CustomSelectPopover>
		</>
	);
}

CustomSelect.Item = CustomSelectItem;

export default CustomSelect;
