import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check } from '@wordpress/icons';
import { Icon } from '../icon';
import itemPopupStyles from '../utils/css/item-popup.module.css';
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
			<_Menu.CheckboxItem
				ref={ ref }
				{ ...itemAriaProps }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					itemPopupStyles.item,
					styles.item,
					styles[ 'has-indicator' ],
					className
				) }
				{ ...props }
			>
				<MenuItemContentContext.Provider value={ contentContextValue }>
					<ItemContent
						prefix={
							<>
								<_Menu.CheckboxItemIndicator
									keepMounted
									className={ styles[ 'item-indicator' ] }
								>
									<Icon
										icon={ check }
										size={ 24 }
										aria-hidden="true"
									/>
								</_Menu.CheckboxItemIndicator>
								{ prefix }
							</>
						}
						suffix={ suffix }
					>
						{ children }
					</ItemContent>
				</MenuItemContentContext.Provider>
			</_Menu.CheckboxItem>
		);
	}
);

export { CheckboxItem };
