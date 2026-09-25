import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../../../text';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import type { AutocompleteItemDescriptionProps } from './types';

/**
 * Supplementary text below an autocomplete item label.
 */
export const ItemDescription = forwardRef<
	HTMLSpanElement,
	AutocompleteItemDescriptionProps
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
