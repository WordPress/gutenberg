import { Select as _Select } from '@base-ui/react/select';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check } from '@wordpress/icons';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import { Icon } from '../../../icon';
import type { SelectItemProps } from './types';

export const Item = forwardRef< HTMLDivElement, SelectItemProps >(
	function Item(
		{ className, value, size = 'default', children = value, ...restProps },
		ref
	) {
		return (
			<_Select.Item
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					itemPopupStyles.item,
					itemPopupStyles[ `is-size-${ size }` ],
					className
				) }
				value={ value }
				ref={ ref }
				{ ...restProps }
			>
				<Icon
					icon={ check }
					className={ clsx(
						itemPopupStyles[ 'item-indicator' ],
						itemPopupStyles[ 'item-indicator-icon' ]
					) }
					size={ size === 'small' ? 20 : 24 }
				/>
				<_Select.ItemText>{ children }</_Select.ItemText>
			</_Select.Item>
		);
	}
);
