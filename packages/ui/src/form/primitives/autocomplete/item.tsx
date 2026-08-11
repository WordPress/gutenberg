import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import type { AutocompleteItemProps } from './types';

export const Item = forwardRef< HTMLDivElement, AutocompleteItemProps >(
	function Item( { className, children, ...restProps }, ref ) {
		return (
			<_Autocomplete.Item
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					itemPopupStyles.item,
					className
				) }
				ref={ ref }
				{ ...restProps }
			>
				{ children }
			</_Autocomplete.Item>
		);
	}
);
