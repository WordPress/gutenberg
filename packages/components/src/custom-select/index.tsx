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

function CustomSelect( props: any ) {
	const { children, defaultValue, label, onChange, value } = props;

	const store = Ariakit.useSelectStore( {
		setValue: ( nextValue ) => onChange?.( nextValue ),
		value,
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
