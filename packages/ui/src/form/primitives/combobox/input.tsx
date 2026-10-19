import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { mergeProps } from '@base-ui/react/merge-props';
import { forwardRef } from '@wordpress/element';
import { search } from '@wordpress/icons';
import { Icon } from '../../../icon';
import { Input as InputPrimitive } from '../input';
import { InputLayout } from '../input-layout';
import type { ComboboxInputProps } from './types';
import styles from './style.module.css';
import { useInputFocus } from '../../../utils/item-popup/input-focus-context';

const DEFAULT_RENDER = ( props: ComboboxInputProps ) => (
	<InputPrimitive
		prefix={
			<InputLayout.Slot padding="minimal">
				<Icon icon={ search } className={ styles[ 'search-icon' ] } />
			</InputLayout.Slot>
		}
		{ ...props }
	/>
);

export const Input = forwardRef< HTMLInputElement, ComboboxInputProps >(
	function UnforwardedInput(
		{ render = DEFAULT_RENDER, ...restProps },
		ref
	) {
		const { inputProps } = useInputFocus();
		return (
			<_Combobox.Input
				ref={ ref }
				render={ render }
				{ ...mergeProps( inputProps, restProps ) }
			/>
		);
	}
);
