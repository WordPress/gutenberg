import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { ComboboxStatusProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * Announces a status message politely to screen readers. Use it for
 * result-count updates and for async list loading. For client-side
 * filtering, call `Combobox.useFilteredItems` from a descendant of
 * `Combobox.Root`.
 *
 * Keep this element mounted. Do not hide it with `display: none`, `hidden`,
 * `aria-hidden`, or by omitting the component. Change or omit the children
 * instead.
 */
export const Status = forwardRef< HTMLDivElement, ComboboxStatusProps >(
	function Status( { className, ...restProps }, ref ) {
		return (
			<_Combobox.Status
				className={ clsx( itemPopupStyles.status, className ) }
				ref={ ref }
				{ ...restProps }
			/>
		);
	}
);
