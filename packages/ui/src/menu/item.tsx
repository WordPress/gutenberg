import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import {
	Children,
	cloneElement,
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
	shortcut?: ItemProps[ 'shortcut' ];
};

function getStructuredItemContent( children: ItemProps[ 'children' ] ) {
	const childArray = Children.toArray( children );
	const label = childArray.find(
		( child ) =>
			isValidElement< { id?: string } >( child ) &&
			child.type === ItemLabel
	);
	const description = childArray.find(
		( child ) =>
			isValidElement< { id?: string } >( child ) &&
			child.type === ItemDescription
	);

	return {
		descriptionId: isValidElement< { id?: string } >( description )
			? description.props.id
			: undefined,
		hasDescription: !! description,
		hasLabel: !! label,
		hasStructuredContent: childArray.some(
			( child ) =>
				isValidElement( child ) &&
				( child.type === ItemLabel || child.type === ItemDescription )
		),
		labelId: isValidElement< { id?: string } >( label )
			? label.props.id
			: undefined,
	};
}

function useItemContent(
	children: ItemProps[ 'children' ],
	{
		'aria-describedby': ariaDescribedBy,
		'aria-keyshortcuts': ariaKeyShortcuts,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		shortcut,
	}: UseItemContentOptions
) {
	const generatedLabelId = useId();
	const generatedDescriptionId = useId();
	const {
		descriptionId,
		hasDescription,
		hasLabel,
		hasStructuredContent,
		labelId,
	} = getStructuredItemContent( children );
	const resolvedLabelId =
		labelId ??
		( hasLabel || ! hasStructuredContent ? generatedLabelId : undefined );
	const resolvedDescriptionId = descriptionId ?? generatedDescriptionId;
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
	labelTrailing,
	prefix,
	shortcut,
	shortcutDescriptionId,
	suffix,
	trailing,
}: Pick< ItemProps, 'children' | 'prefix' | 'shortcut' | 'suffix' > & {
	labelTrailing?: ItemProps[ 'suffix' ];
	shortcutDescriptionId?: string;
	trailing?: ItemProps[ 'suffix' ];
} ) {
	const hasStructuredContent =
		getStructuredItemContent( children ).hasStructuredContent;
	const itemChildren = hasStructuredContent ? (
		Children.map( children, ( child ) => {
			if (
				isValidElement< { children?: ItemProps[ 'children' ] } >(
					child
				) &&
				child.type === ItemLabel
			) {
				return cloneElement( child, {
					children: (
						<>
							{ child.props.children }
							{ labelTrailing }
						</>
					),
				} );
			}

			return child;
		} )
	) : (
		<ItemLabel>
			{ children }
			{ labelTrailing }
		</ItemLabel>
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
					{ itemChildren }
				</span>
				{ suffix && (
					<span className={ styles[ 'item-suffix' ] }>
						{ suffix }
					</span>
				) }
				{ shortcut && (
					<span className={ styles[ 'item-shortcut' ] }>
						<KeyboardShortcutDisplay shortcut={ shortcut } />
					</span>
				) }
				{ trailing && (
					<span className={ styles[ 'item-trailing' ] }>
						{ trailing }
					</span>
				) }
			</span>
			{ prefix && (
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
