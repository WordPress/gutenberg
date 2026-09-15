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
		{ className, children, variant = 'default', ...restProps },
		ref
	) {
		return (
			<_Combobox.Item
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					itemPopupStyles.item,
					className
				) }
				ref={ ref }
				{ ...restProps }
			>
				<span
					className={ itemPopupStyles[ 'item-icon' ] }
					aria-hidden="true"
				>
					<Icon
						icon={ variant === 'creatable' ? plus : check }
						className={
							variant !== 'creatable'
								? itemPopupStyles[ 'item-indicator-icon' ]
								: undefined
						}
						size={ 24 }
					/>
				</span>
				{ children }
			</_Combobox.Item>
		);
	}
);
