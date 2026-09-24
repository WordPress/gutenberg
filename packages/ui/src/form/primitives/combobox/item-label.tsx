import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../../../text';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import type { ComboboxItemLabelProps } from './types';

/**
 * The primary label of a combobox item. Use it as the first direct child of
 * every item. Its content is the item's accessible name. The selected value
 * still uses the item's `label` or the content of `Combobox.Value`.
 */
export const ItemLabel = forwardRef< HTMLSpanElement, ComboboxItemLabelProps >(
	function ItemLabel( { className, ...restProps }, ref ) {
		return (
			<Text
				ref={ ref }
				variant="body-md"
				className={ clsx( itemPopupStyles[ 'item-label' ], className ) }
				{ ...restProps }
			/>
		);
	}
);
