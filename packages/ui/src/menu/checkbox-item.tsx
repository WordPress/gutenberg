import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check } from '@wordpress/icons';
import { Icon } from '../icon';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { MenuItemContentContext } from './context';
import { ItemContent, useItemContent } from './item';
import type { CheckboxItemProps } from './types';

/**
 * Renders a menu item that toggles a setting on or off.
 */
const CheckboxItem = forwardRef< HTMLDivElement, CheckboxItemProps >(
	function MenuCheckboxItem(
		{
			children,
			className,
			prefix,
			shortcut,
			suffix,
			'aria-describedby': ariaDescribedBy,
			'aria-keyshortcuts': ariaKeyShortcuts,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			...props
		},
		ref
	) {
		const {
			contentChildren,
			contentContextValue,
			itemAriaProps,
			shortcutDescriptionId,
		} = useItemContent( children, {
			'aria-describedby': ariaDescribedBy,
			'aria-keyshortcuts': ariaKeyShortcuts,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			shortcut,
		} );

		return (
			<_Menu.CheckboxItem
				ref={ ref }
				{ ...itemAriaProps }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.item,
					className
				) }
				{ ...props }
			>
				<_Menu.CheckboxItemIndicator
					keepMounted
					className={ styles[ 'item-selection-indicator' ] }
				>
					<Icon icon={ check } size={ 24 } aria-hidden="true" />
				</_Menu.CheckboxItemIndicator>
				<MenuItemContentContext.Provider value={ contentContextValue }>
					<ItemContent
						prefix={ prefix }
						shortcut={ shortcut }
						shortcutDescriptionId={ shortcutDescriptionId }
						suffix={ suffix }
					>
						{ contentChildren }
					</ItemContent>
				</MenuItemContentContext.Provider>
			</_Menu.CheckboxItem>
		);
	}
);

export { CheckboxItem };
