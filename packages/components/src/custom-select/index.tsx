/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import { type CustomSelectProps } from './types';
import { CustomSelectButton, CustomSelectPopover } from './styles';
import CustomSelectItem from './custom-select-item';

function CustomSelect( {
	children,
	label,
	onChange,
	value,
}: CustomSelectProps ) {
	const store = Ariakit.useSelectStore( {
		setValue: ( nextValue ) => {
			onChange?.( nextValue );
		},
		value,
	} );

	return (
		<>
			<Ariakit.SelectLabel store={ store }>{ label }</Ariakit.SelectLabel>
			<CustomSelectButton store={ store } />
			<CustomSelectPopover sameWidth store={ store }>
				{ children }
			</CustomSelectPopover>
		</>
	);
}

CustomSelect.Item = CustomSelectItem;
export default CustomSelect;
