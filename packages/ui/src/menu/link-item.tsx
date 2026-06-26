import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import itemPopupStyles from '../utils/css/item-popup.module.css';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { ItemContent } from './item';
import type { LinkItemProps } from './types';

/**
 * Renders a menu item that navigates to a link target.
 */
const LinkItem = forwardRef< Element, LinkItemProps >( function MenuLinkItem(
	{ children, className, prefix, suffix, ...props },
	ref
) {
	return (
		<_Menu.LinkItem
			ref={ ref }
			className={ clsx(
				defenseStyles.a,
				resetStyles[ 'box-sizing' ],
				itemPopupStyles.item,
				styles.item,
				className
			) }
			{ ...props }
		>
			<ItemContent prefix={ prefix } suffix={ suffix }>
				{ children }
			</ItemContent>
		</_Menu.LinkItem>
	);
} );

export { LinkItem };
