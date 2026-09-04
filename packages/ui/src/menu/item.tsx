import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { Children, forwardRef } from '@wordpress/element';
import resetStyles from '../utils/css/resets.module.css';
import {
	KeyboardShortcutDescription,
	KeyboardShortcutDisplay,
	useKeyboardShortcutProps,
} from '../utils/keyboard-shortcut';
import { useItemContent as usePopupItemContent } from '../utils/item-popup';
import styles from './style.module.css';
import { MenuItemContentContext } from './context';
import { ItemDescription } from './item-description';
import { ItemLabel } from './item-label';
import type { ItemProps } from './types';

type ItemAriaProps = Pick<
	ItemProps,
	'aria-describedby' | 'aria-keyshortcuts' | 'aria-label' | 'aria-labelledby'
>;
type UseItemContentOptions = ItemAriaProps & {
	labelTrailing?: ItemProps[ 'suffix' ];
	shortcut?: ItemProps[ 'shortcut' ];
};

const ITEM_CONTENT_COMPONENTS = {
	Label: ItemLabel,
	Description: ItemDescription,
	validationMessage:
		'Menu.ItemLabel must be the first direct child of every menu item, followed only by Menu.ItemDescription components.',
};

function useItemContent(
	children: ItemProps[ 'children' ],
	{
		'aria-describedby': ariaDescribedBy,
		'aria-keyshortcuts': ariaKeyShortcuts,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		labelTrailing,
		shortcut,
	}: UseItemContentOptions
) {
	const { contentChildren, resolvedLabelId, itemAriaProps } =
		usePopupItemContent( children, ITEM_CONTENT_COMPONENTS, {
			'aria-describedby': ariaDescribedBy,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
		} );
	const {
		descriptionId: shortcutDescriptionId,
		targetProps: shortcutAriaProps,
	} = useKeyboardShortcutProps( {
		'aria-describedby': itemAriaProps[ 'aria-describedby' ],
		'aria-keyshortcuts': ariaKeyShortcuts,
		shortcut,
	} );

	return {
		// React widens the tuple while mapping; validation preserves the item-child
		// contract and cloning changes only generated description IDs.
		contentChildren: contentChildren as ItemProps[ 'children' ],
		contentContextValue: {
			labelId: resolvedLabelId,
			labelTrailing,
		},
		itemAriaProps: {
			...shortcutAriaProps,
			'aria-label': itemAriaProps[ 'aria-label' ],
			'aria-labelledby': itemAriaProps[ 'aria-labelledby' ],
		},
		shortcutDescriptionId,
	};
}

function ItemContent( {
	children,
	prefix,
	shortcut,
	shortcutDescriptionId,
	suffix,
	trailing,
}: Pick< ItemProps, 'children' | 'prefix' | 'shortcut' | 'suffix' > & {
	shortcutDescriptionId?: string;
	trailing?: ItemProps[ 'suffix' ];
} ) {
	const hasPrefix = Children.toArray( prefix ).some(
		( child ) => child !== ''
	);
	const hasSuffix = Children.toArray( suffix ).some(
		( child ) => child !== ''
	);
	const hasTrailing = Children.toArray( trailing ).some(
		( child ) => child !== ''
	);

	/*
	 * Content comes first in the DOM because Base UI falls back to the item's
	 * textContent for typeahead. CSS grid still places the optional
	 * presentational prefix in the earlier visual column.
	 */
	return (
		<>
			<span className={ styles[ 'item-content' ] }>
				<span className={ styles[ 'item-children' ] }>
					{ children }
				</span>
				{ hasSuffix && (
					<span className={ styles[ 'item-suffix' ] }>
						{ suffix }
					</span>
				) }
				{ shortcut && (
					<span className={ styles[ 'item-shortcut' ] }>
						<KeyboardShortcutDisplay shortcut={ shortcut } />
					</span>
				) }
				{ hasTrailing && (
					<span className={ styles[ 'item-trailing' ] }>
						{ trailing }
					</span>
				) }
			</span>
			{ hasPrefix && (
				<span aria-hidden="true" className={ styles[ 'item-prefix' ] }>
					{ prefix }
				</span>
			) }
			{ shortcut && shortcutDescriptionId && (
				<KeyboardShortcutDescription
					descriptionId={ shortcutDescriptionId }
					shortcut={ shortcut }
				/>
			) }
		</>
	);
}

/**
 * Renders an individual menu item.
 */
const Item = forwardRef< HTMLDivElement, ItemProps >( function MenuItem(
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
		<_Menu.Item
			ref={ ref }
			{ ...itemAriaProps }
			className={ clsx(
				resetStyles[ 'box-sizing' ],
				styles.item,
				className
			) }
			{ ...props }
		>
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
		</_Menu.Item>
	);
} );

export { Item, ItemContent, useItemContent };
