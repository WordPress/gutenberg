import { Menu as BaseMenu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { ItemContent } from './item-content';
import type { MenuItemProps } from './types';
import styles from './styles.module.css';

const Item = forwardRef< HTMLDivElement, MenuItemProps >(
	( { className, children, prefix, suffix, helpText, ...props }, ref ) => (
		<BaseMenu.Item
			ref={ ref }
			className={ clsx( styles.item, className ) }
			{ ...props }
		>
			<span className={ styles.prefix }>{ prefix }</span>
			<ItemContent suffix={ suffix } helpText={ helpText }>
				{ children }
			</ItemContent>
		</BaseMenu.Item>
	)
);
Item.displayName = 'Menu.Item';

export { Item };
