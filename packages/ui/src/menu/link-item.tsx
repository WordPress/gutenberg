import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import itemPopupStyles from '../utils/css/item-popup.module.css';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { MenuItemContentContext } from './context';
import { ItemContent, useItemContent } from './item';
import type { LinkItemProps } from './types';

/**
 * Renders a menu item that navigates to a link target.
 */
const LinkItem = forwardRef< Element, LinkItemProps >( function MenuLinkItem(
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
	const { contentContextValue, itemAriaProps } = useItemContent( children, {
		'aria-describedby': ariaDescribedBy,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
	} );

	return (
		<_Menu.LinkItem
			ref={ ref }
			{ ...itemAriaProps }
			className={ clsx(
				defenseStyles.a,
				resetStyles[ 'box-sizing' ],
				itemPopupStyles.item,
				styles.item,
				className
			) }
			{ ...props }
		>
			<MenuItemContentContext.Provider value={ contentContextValue }>
				<ItemContent prefix={ prefix } suffix={ suffix }>
					{ children }
				</ItemContent>
			</MenuItemContentContext.Provider>
		</_Menu.LinkItem>
	);
} );

export { LinkItem };
