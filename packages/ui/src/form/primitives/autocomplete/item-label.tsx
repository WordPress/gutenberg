import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../../../text';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import type { AutocompleteItemLabelProps } from './types';

/**
 * The primary label and accessible name of an autocomplete item.
 */
export const ItemLabel = forwardRef<
	HTMLSpanElement,
	AutocompleteItemLabelProps
>( function ItemLabel( { className, ...restProps }, ref ) {
	return (
		<Text
			ref={ ref }
			variant="body-md"
			className={ clsx( itemPopupStyles[ 'item-label' ], className ) }
			{ ...restProps }
		/>
	);
} );
