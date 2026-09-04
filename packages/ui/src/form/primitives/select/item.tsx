import { Select as _Select } from '@base-ui/react/select';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check } from '@wordpress/icons';
import { useItemContent } from '../../../utils/item-popup';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import { Icon } from '../../../icon';
import { ItemDescription } from './item-description';
import { ItemLabel } from './item-label';
import type { SelectItemProps } from './types';

const ITEM_CONTENT_COMPONENTS = {
	Label: ItemLabel,
	Description: ItemDescription,
	validationMessage:
		'Select.ItemLabel must be the first direct child of every select item, followed only by Select.ItemDescription components.',
};

export const Item = forwardRef< HTMLDivElement, SelectItemProps >(
	function Item(
		{
			className,
			value,
			size = 'default',
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
			<_Select.Item
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					itemPopupStyles.item,
					size === 'small' && itemPopupStyles[ 'is-size-small' ],
					className
				) }
				value={ value }
				ref={ ref }
				{ ...itemAriaProps }
				{ ...restProps }
			>
				<Icon
					icon={ check }
					className={ clsx(
						itemPopupStyles[ 'item-icon' ],
						itemPopupStyles[ 'item-indicator-icon' ]
					) }
					size={ size === 'small' ? 20 : 24 }
				/>
				<span className={ itemPopupStyles[ 'item-text' ] }>
					{ contentChildren }
				</span>
			</_Select.Item>
		);
	}
);
