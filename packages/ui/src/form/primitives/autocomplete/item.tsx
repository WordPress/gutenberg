import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { useItemContent } from '../../../utils/item-popup';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import { ItemDescription } from './item-description';
import { ItemLabel } from './item-label';
import type { AutocompleteItemProps } from './types';

const ITEM_CONTENT_COMPONENTS = {
	Label: ItemLabel,
	Description: ItemDescription,
	validationMessage:
		'Autocomplete.ItemLabel must be the first direct child of every autocomplete item, followed only by Autocomplete.ItemDescription components.',
};

export const Item = forwardRef< HTMLDivElement, AutocompleteItemProps >(
	function Item(
		{
			className,
			children,
			'aria-describedby': ariaDescribedBy,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			...restProps
		},
		ref
	) {
		const { contentChildren, itemAriaProps } = useItemContent(
			children,
			ITEM_CONTENT_COMPONENTS,
			{
				'aria-describedby': ariaDescribedBy,
				'aria-label': ariaLabel,
				'aria-labelledby': ariaLabelledBy,
			}
		);

		return (
			<_Autocomplete.Item
				className={ clsx(
					defenseStyles.div,
					resetStyles[ 'box-sizing' ],
					itemPopupStyles.item,
					className
				) }
				ref={ ref }
				{ ...itemAriaProps }
				{ ...restProps }
			>
				<div className={ itemPopupStyles[ 'item-text' ] }>
					{ contentChildren }
				</div>
			</_Autocomplete.Item>
		);
	}
);
