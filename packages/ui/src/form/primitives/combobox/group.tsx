import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { ComboboxGroupProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * Groups related items together with an associated label rendered by
 * `Combobox.GroupLabel`. When `items` is provided, child
 * `Combobox.Collection` components iterate over them.
 */
export const Group = forwardRef< HTMLDivElement, ComboboxGroupProps >(
	function Group( { className, children, ...restProps }, ref ) {
		return (
			<_Combobox.Group
				className={ clsx( itemPopupStyles.group, className ) }
				ref={ ref }
				{ ...restProps }
			>
				{ children }
			</_Combobox.Group>
		);
	}
);
