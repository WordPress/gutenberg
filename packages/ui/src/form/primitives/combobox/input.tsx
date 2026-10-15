import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { mergeProps } from '@base-ui/react/merge-props';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { search } from '@wordpress/icons';
import { Icon } from '../../../icon';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import { Input as InputPrimitive } from '../input';
import { InputLayout } from '../input-layout';
import type { ComboboxInputProps } from './types';
import styles from './style.module.css';
import { useKeyboardHighlight } from '../../../utils/item-popup/keyboard-highlight-context';

const DEFAULT_RENDER = ( { className, ...props }: ComboboxInputProps ) => (
	<InputPrimitive
		prefix={
			<InputLayout.Slot
				padding="minimal"
				className={ itemPopupStyles[ 'search-input-prefix' ] }
			>
				<Icon
					icon={ search }
					className={ clsx(
						styles[ 'search-icon' ],
						itemPopupStyles[ 'search-input-icon' ]
					) }
				/>
			</InputLayout.Slot>
		}
		{ ...props }
		className={ clsx( itemPopupStyles[ 'search-input' ], className ) }
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
