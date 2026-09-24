import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../../../text';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import type { ComboboxItemDescriptionProps } from './types';

/**
 * Supplementary text below a combobox item label. Use it as a direct child
 * after `Combobox.ItemLabel`. Content should be text or non-interactive inline
 * markup.
 */
export const ItemDescription = forwardRef<
	HTMLSpanElement,
	ComboboxItemDescriptionProps
>( function ItemDescription( { className, ...restProps }, ref ) {
	return (
		<Text
			ref={ ref }
			variant="body-sm"
			className={ clsx(
				itemPopupStyles[ 'item-description' ],
				className
			) }
			{ ...restProps }
		/>
	);
} );
