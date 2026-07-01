import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check } from '@wordpress/icons';
import { Icon } from '../icon';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { MenuItemContentContext } from './context';
import { ItemContent, useItemContent } from './item';
import type { RadioItemProps } from './types';

/**
 * Renders a menu item that works like a radio button in a group.
 */
const RadioItem = forwardRef< HTMLDivElement, RadioItemProps >(
	function MenuRadioItem(
		{
			children,
			className,
			prefix,
			suffix,
			'aria-describedby': ariaDescribedBy,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			...props
		},
		ref
	) {
		const { contentContextValue, itemAriaProps } = useItemContent(
			children,
			{
				'aria-describedby': ariaDescribedBy,
				'aria-label': ariaLabel,
				'aria-labelledby': ariaLabelledBy,
			}
		);

		return (
			<_Menu.RadioItem
				ref={ ref }
				{ ...itemAriaProps }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.item,
					styles[ 'has-selection-indicator' ],
					className
				) }
				{ ...props }
			>
				<_Menu.RadioItemIndicator
					keepMounted
					className={ styles[ 'item-selection-indicator' ] }
				>
					<Icon icon={ check } size={ 24 } aria-hidden="true" />
				</_Menu.RadioItemIndicator>
				<MenuItemContentContext.Provider value={ contentContextValue }>
					<ItemContent prefix={ prefix } suffix={ suffix }>
						{ children }
					</ItemContent>
				</MenuItemContentContext.Provider>
			</_Menu.RadioItem>
		);
	}
);

export { RadioItem };
