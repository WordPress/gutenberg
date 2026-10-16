import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { mergeProps } from '@base-ui/react/merge-props';
import { forwardRef } from '@wordpress/element';
import { search } from '@wordpress/icons';
import { Icon } from '../../../icon';
import { Input as InputPrimitive } from '../input';
import { InputLayout } from '../input-layout';
import type { ComboboxInputProps } from './types';
import styles from './style.module.css';
import { useKeyboardHighlight } from '../../../utils/item-popup/keyboard-highlight-context';

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
		const { onInputFocusChange, onPointerHighlight } =
			useKeyboardHighlight();
		return (
			<_Combobox.Input
				ref={ ref }
				render={ render }
				{ ...mergeProps(
					{
						onFocusCapture: () => onInputFocusChange( true ),
						onBlurCapture: () => onInputFocusChange( false ),
						onPointerDownCapture: onPointerHighlight,
					},
					restProps
				) }
			/>
		);
	}
);
