import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { ComboboxEmptyProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

export const Empty = forwardRef< HTMLDivElement, ComboboxEmptyProps >(
	function Empty( { className, ...restProps }, ref ) {
		return (
			<_Combobox.Empty
				className={ clsx( itemPopupStyles.empty, className ) }
				ref={ ref }
				{ ...restProps }
			/>
		);
	}
);
