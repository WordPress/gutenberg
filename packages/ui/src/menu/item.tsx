import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import itemPopupStyles from '../utils/css/item-popup.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import type { ItemProps } from './types';

function ItemContent( {
	children,
	prefix,
	suffix,
}: Pick< ItemProps, 'children' | 'prefix' | 'suffix' > ) {
	return (
		<>
			{ prefix && (
				<span className={ styles[ 'item-prefix' ] }>{ prefix }</span>
			) }
			<span
				className={ clsx(
					styles[ 'item-content' ],
					! prefix && styles[ 'item-content-without-prefix' ]
				) }
			>
				<span className={ styles[ 'item-label' ] }>{ children }</span>
				{ suffix && (
					<span className={ styles[ 'item-suffix' ] }>
						{ suffix }
					</span>
				) }
			</span>
		</>
	);
}

/**
 * Renders an individual menu item.
 */
const Item = forwardRef< HTMLDivElement, ItemProps >( function MenuItem(
	{ children, className, prefix, suffix, ...props },
	ref
) {
	return (
		<_Menu.Item
			ref={ ref }
			className={ clsx(
				resetStyles[ 'box-sizing' ],
				itemPopupStyles.item,
				styles.item,
				prefix && styles[ 'has-prefix' ],
				className
			) }
			{ ...props }
		>
			<ItemContent prefix={ prefix } suffix={ suffix }>
				{ children }
			</ItemContent>
		</_Menu.Item>
	);
} );

export { Item, ItemContent };
