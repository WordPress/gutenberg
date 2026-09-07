import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import {
	Children,
	cloneElement,
	forwardRef,
	isValidElement,
	useId,
} from '@wordpress/element';
import type { ReactElement } from 'react';
import resetStyles from '../utils/css/resets.module.css';
import {
	KeyboardShortcutDescription,
	KeyboardShortcutDisplay,
	useKeyboardShortcutProps,
} from '../utils/keyboard-shortcut';
import styles from './style.module.css';
import { MenuItemContentContext } from './context';
import { ItemDescription } from './item-description';
import { ItemLabel } from './item-label';
import type { ItemDescriptionProps, ItemProps } from './types';

type ItemAriaProps = Pick<
	ItemProps,
	'aria-describedby' | 'aria-keyshortcuts' | 'aria-label' | 'aria-labelledby'
>;
type UseItemContentOptions = ItemAriaProps & {
	labelTrailing?: ItemProps[ 'suffix' ];
	shortcut?: ItemProps[ 'shortcut' ];
};

const VALIDATION_ENABLED = process.env.NODE_ENV !== 'production';

function getItemContent( children: ItemProps[ 'children' ] ) {
	const childArray = Children.toArray( children );
	const [ label, ...descriptions ] = childArray;
	const hasLabel =
		isValidElement< { id?: string } >( label ) && label.type === ItemLabel;
	const descriptionElements = descriptions.filter(
		( description ): description is ReactElement< ItemDescriptionProps > =>
			isValidElement< ItemDescriptionProps >( description ) &&
			description.type === ItemDescription
	);

	if (
		VALIDATION_ENABLED &&
		( ! hasLabel || descriptionElements.length !== descriptions.length )
	) {
		throw new Error(
			'Menu.ItemLabel must be the first direct child of every menu item, followed only by Menu.ItemDescription components.'
		);
	}

	return {
		descriptionIds: descriptionElements.map(
			( description ) => description.props.id
		),
		hasLabel,
		labelId: hasLabel ? label.props.id : undefined,
	};
}

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
	const generatedLabelId = useId();
	const generatedDescriptionId = useId();
	const { descriptionIds, hasLabel, labelId } = getItemContent( children );
	const resolvedLabelId = hasLabel ? labelId ?? generatedLabelId : undefined;
	const resolvedDescriptionIds = descriptionIds.map(
		( descriptionId, index ) =>
			descriptionId ?? `${ generatedDescriptionId }-${ index }`
	);
	const itemDescribedBy = Array.from(
		new Set( [
			...( ariaDescribedBy?.split( /\s+/ ).filter( Boolean ) ?? [] ),
			...resolvedDescriptionIds,
		] )
	).join( ' ' );
	let descriptionIndex = 0;
	// React widens the tuple while mapping; validation preserves the item-child
	// contract and cloning changes only generated description IDs.
	const contentChildren = Children.map( children, ( child ) => {
		if (
			! isValidElement< ItemDescriptionProps >( child ) ||
			child.type !== ItemDescription
		) {
			return child;
		}

		const descriptionId = resolvedDescriptionIds[ descriptionIndex++ ];
		return child.props.id === descriptionId
			? child
			: cloneElement( child, { id: descriptionId } );
	} ) as ItemProps[ 'children' ];
	const {
		descriptionId: shortcutDescriptionId,
		targetProps: shortcutAriaProps,
	} = useKeyboardShortcutProps( {
		'aria-describedby': itemDescribedBy || undefined,
		'aria-keyshortcuts': ariaKeyShortcuts,
		shortcut,
	} );
	/*
	 * `aria-labelledby` takes precedence over `aria-label` in the accessible
	 * name algorithm. Only provide our generated label relationship when the
	 * consumer has not supplied either explicit naming prop, so explicit naming
	 * stays fully consumer-controlled.
	 */
	const labelledBy =
		ariaLabelledBy ?? ( ariaLabel ? undefined : resolvedLabelId );

	return {
		contentChildren,
		contentContextValue: {
			labelId: resolvedLabelId,
			labelTrailing,
		},
		itemAriaProps: {
			...shortcutAriaProps,
			'aria-label': ariaLabel,
			'aria-labelledby': labelledBy,
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
