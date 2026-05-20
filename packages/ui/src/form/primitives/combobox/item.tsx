import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check, plus } from '@wordpress/icons';
import { Icon } from '../../../icon';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import type { ComboboxItemProps } from './types';

export const Item = forwardRef< HTMLDivElement, ComboboxItemProps >(
	function Item(
		{
			className,
			children,
			size = 'default',
			variant = 'default',
			...restProps
		},
		ref
	) {
		return (
			<_Combobox.Item
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					itemPopupStyles.item,
					itemPopupStyles[ `is-size-${ size }` ],
					className
				) }
				ref={ ref }
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
				{ children }
			</_Combobox.Item>
		);
	}
);
