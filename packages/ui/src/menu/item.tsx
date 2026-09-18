import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import {
	Children,
	forwardRef,
	isValidElement,
	useId,
} from '@wordpress/element';
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
import type { ItemProps } from './types';

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
	const [ label, description, ...unexpectedChildren ] = childArray;
	const hasLabel =
		isValidElement< { id?: string } >( label ) && label.type === ItemLabel;
	const hasDescription =
		isValidElement< { id?: string } >( description ) &&
		description.type === ItemDescription;

	if (
		VALIDATION_ENABLED &&
		( ! hasLabel ||
			( description !== undefined && ! hasDescription ) ||
			unexpectedChildren.length > 0 )
	) {
		throw new Error(
			'Menu.ItemLabel must be the first direct child of every menu item, followed only by an optional Menu.ItemDescription.'
		);
	}

	return {
		descriptionId: hasDescription ? description.props.id : undefined,
		hasDescription,
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
	const { descriptionId, hasDescription, hasLabel, labelId } =
		getItemContent( children );
	const resolvedLabelId = hasLabel ? labelId ?? generatedLabelId : undefined;
	const resolvedDescriptionId = hasDescription
		? descriptionId ?? generatedDescriptionId
		: undefined;
	const itemDescribedBy = [
		ariaDescribedBy,
		hasDescription && resolvedDescriptionId,
	]
		.filter( Boolean )
		.join( ' ' );
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
		contentContextValue: {
			descriptionId: resolvedDescriptionId,
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
	const { contentContextValue, itemAriaProps, shortcutDescriptionId } =
		useItemContent( children, {
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
					{ children }
				</ItemContent>
			</MenuItemContentContext.Provider>
		</_Menu.Item>
	);
} );

export { Item, ItemContent, useItemContent };
