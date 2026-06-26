import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { Children, forwardRef, isValidElement } from '@wordpress/element';
import itemPopupStyles from '../utils/css/item-popup.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { ItemDescription } from './item-description';
import { ItemLabel } from './item-label';
import type { ItemProps } from './types';

function hasStructuredItemContent( children: ItemProps[ 'children' ] ) {
	return Children.toArray( children ).some(
		( child ) =>
			isValidElement( child ) &&
			( child.type === ItemLabel || child.type === ItemDescription )
	);
}

function ItemContent( {
	children,
	prefix,
	suffix,
}: Pick< ItemProps, 'children' | 'prefix' | 'suffix' > ) {
	const itemChildren = hasStructuredItemContent( children ) ? (
		children
	) : (
		<ItemLabel>{ children }</ItemLabel>
	);

	return (
		<>
			<span className={ styles[ 'item-prefix' ] }>{ prefix }</span>
			<span className={ styles[ 'item-content' ] }>
				<span className={ styles[ 'item-children' ] }>
					{ itemChildren }
				</span>
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
