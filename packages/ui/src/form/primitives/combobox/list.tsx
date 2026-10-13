import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { mergeProps } from '@base-ui/react/merge-props';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { ComboboxListProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import { useKeyboardHighlight } from '../../../utils/item-popup/keyboard-highlight-context';

export const List = forwardRef< HTMLDivElement, ComboboxListProps >(
	function UnforwardedList( { className, ...restProps }, ref ) {
		const { onPointerHighlight } = useKeyboardHighlight();
		return (
			<_Combobox.List
				className={ clsx( itemPopupStyles.list, className ) }
				ref={ ref }
				{ ...mergeProps(
					{
						onPointerMoveCapture: onPointerHighlight,
						onPointerDownCapture: onPointerHighlight,
					},
					restProps
				) }
			/>
		);
	}
);
