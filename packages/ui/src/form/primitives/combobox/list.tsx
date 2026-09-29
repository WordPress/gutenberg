import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { ComboboxListProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

export const List = forwardRef< HTMLDivElement, ComboboxListProps >(
	function List( { className, ...restProps }, ref ) {
		return (
			<_Combobox.List
				className={ clsx( itemPopupStyles.list, className ) }
				ref={ ref }
				{ ...restProps }
			/>
		);
	}
);
