import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { forwardRef } from '@wordpress/element';
import { search } from '@wordpress/icons';
import { Icon } from '../../../icon';
import { Input as InputPrimitive } from '../input';
import { InputLayout } from '../input-layout';
import type { ComboboxInputProps } from './types';

const DEFAULT_RENDER = ( props: ComboboxInputProps ) => (
	<InputPrimitive
		prefix={
			<InputLayout.Slot padding="minimal">
				<Icon icon={ search } />
			</InputLayout.Slot>
		}
		{ ...props }
	/>
);

export const Input = forwardRef< HTMLInputElement, ComboboxInputProps >(
	function Input( { render = DEFAULT_RENDER, ...restProps }, ref ) {
		return (
			<_Combobox.Input ref={ ref } render={ render } { ...restProps } />
		);
	}
);
