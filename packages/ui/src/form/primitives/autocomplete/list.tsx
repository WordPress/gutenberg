import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { mergeProps } from '@base-ui/react/merge-props';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteListProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import { useKeyboardHighlight } from '../../../utils/item-popup/keyboard-highlight-context';

export const List = forwardRef< HTMLDivElement, AutocompleteListProps >(
	function UnforwardedList( { className, ...restProps }, ref ) {
		const { onPointerHighlight } = useKeyboardHighlight();
		return (
			<_Autocomplete.List
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
