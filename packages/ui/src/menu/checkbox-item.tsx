import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check } from '@wordpress/icons';
import { Icon } from '../icon';
import itemPopupStyles from '../utils/css/item-popup.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import type { CheckboxItemProps } from './types';

/**
 * Renders a menu item that toggles a setting on or off.
 */
const CheckboxItem = forwardRef< HTMLDivElement, CheckboxItemProps >(
	function MenuCheckboxItem(
		{ children, className, prefix, suffix, ...props },
		ref
	) {
		return (
			<_Menu.CheckboxItem
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					itemPopupStyles.item,
					styles.item,
					styles[ 'has-indicator' ],
					className
				) }
				{ ...props }
			>
				<span className={ styles[ 'item-prefix' ] }>
					<_Menu.CheckboxItemIndicator
						keepMounted
						className={ styles[ 'item-indicator' ] }
					>
						<Icon icon={ check } size={ 24 } />
					</_Menu.CheckboxItemIndicator>
					{ prefix }
				</span>
				<span className={ styles[ 'item-content' ] }>
					<span className={ styles[ 'item-label' ] }>
						{ children }
					</span>
					{ suffix && (
						<span className={ styles[ 'item-suffix' ] }>
							{ suffix }
						</span>
					) }
				</span>
			</_Menu.CheckboxItem>
		);
	}
);

export { CheckboxItem };
