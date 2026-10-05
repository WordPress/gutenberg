import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteStatusProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * Announces a status message politely to screen readers. Use it for the
 * status of an asynchronously loaded list.
 *
 * Keep this element mounted. Do not hide it with `display: none`, `hidden`,
 * `aria-hidden`, or by omitting the component. Change or omit the children
 * instead.
 */
export const Status = forwardRef< HTMLDivElement, AutocompleteStatusProps >(
	function Status( { className, ...restProps }, ref ) {
		return (
			<_Autocomplete.Status
				className={ clsx( itemPopupStyles.status, className ) }
				ref={ ref }
				{ ...restProps }
			/>
		);
	}
);
