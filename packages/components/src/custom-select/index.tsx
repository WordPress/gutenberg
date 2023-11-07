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

	const defaultSelect = () => {
		if ( typeof defaultValue === 'object' ) {
			return (
				<CustomSelectButton store={ store }>
					{ defaultValue }
				</CustomSelectButton>
			);
		}
		return <CustomSelectButton store={ store } />;
	};

	return (
		<>
			<Ariakit.SelectLabel store={ store }>{ label }</Ariakit.SelectLabel>
			{ defaultSelect() }
			<CustomSelectPopover gutter={ 4 } sameWidth store={ store }>
				{ children }
			</CustomSelectPopover>
		</>
	);
}

CustomSelect.Item = CustomSelectItem;

export default CustomSelect;
