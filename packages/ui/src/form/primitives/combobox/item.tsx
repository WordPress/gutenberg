import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check, plus } from '@wordpress/icons';
import { Icon } from '../../../icon';
import { useItemContent } from '../../../utils/item-popup';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import { ItemDescription } from './item-description';
import { ItemLabel } from './item-label';
import type { ComboboxItemProps } from './types';

const ITEM_CONTENT_COMPONENTS = {
	Label: ItemLabel,
	Description: ItemDescription,
	validationMessage:
		'Combobox.ItemLabel must be the first direct child of every combobox item, followed only by Combobox.ItemDescription components.',
};

export const Item = forwardRef< HTMLDivElement, ComboboxItemProps >(
	function Item(
		{
			className,
			children,
			variant = 'default',
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
			<_Combobox.Item
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
				<Icon
					icon={ variant === 'creatable' ? plus : check }
					className={ clsx(
						itemPopupStyles[ 'item-icon' ],
						variant !== 'creatable' &&
							itemPopupStyles[ 'item-indicator-icon' ]
					) }
					size={ 24 }
				/>
				<div className={ itemPopupStyles[ 'item-text' ] }>
					{ contentChildren }
				</div>
			</_Combobox.Item>
		);
	}
);
