import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import {
	Children,
	forwardRef,
	isValidElement,
	useId,
} from '@wordpress/element';
import itemPopupStyles from '../utils/css/item-popup.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { MenuItemContentContext } from './context';
import { ItemDescription } from './item-description';
import { ItemLabel } from './item-label';
import type { ItemProps } from './types';

type ItemAriaProps = Pick<
	ItemProps,
	'aria-describedby' | 'aria-label' | 'aria-labelledby'
>;

function getStructuredItemContent( children: ItemProps[ 'children' ] ) {
	const childArray = Children.toArray( children );

	return {
		hasDescription: childArray.some(
			( child ) =>
				isValidElement( child ) && child.type === ItemDescription
		),
		hasStructuredContent: childArray.some(
			( child ) =>
				isValidElement( child ) &&
				( child.type === ItemLabel || child.type === ItemDescription )
		),
	};
}

function useItemContent(
	children: ItemProps[ 'children' ],
	{
		'aria-describedby': ariaDescribedBy,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
	}: ItemAriaProps
) {
	const labelId = useId();
	const descriptionId = useId();
	const { hasDescription } = getStructuredItemContent( children );

	const describedBy = [ ariaDescribedBy, hasDescription && descriptionId ]
		.filter( Boolean )
		.join( ' ' );
	/*
	 * `aria-labelledby` takes precedence over `aria-label` in the accessible
	 * name algorithm. Only provide our generated label relationship when the
	 * consumer has not supplied either explicit naming prop.
	 */
	const labelledBy = ariaLabelledBy ?? ( ariaLabel ? undefined : labelId );

	return {
		contentContextValue: {
			labelId,
			descriptionId,
		},
		itemAriaProps: {
			'aria-describedby': describedBy || undefined,
			'aria-label': ariaLabel,
			'aria-labelledby': labelledBy,
		},
	};
}

function ItemContent( {
	children,
	prefix,
	suffix,
}: Pick< ItemProps, 'children' | 'prefix' | 'suffix' > ) {
	const itemChildren = getStructuredItemContent( children )
		.hasStructuredContent ? (
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
		<_Menu.Item
			ref={ ref }
			{ ...itemAriaProps }
			className={ clsx(
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
		</_Menu.Item>
	);
} );

export { Item, ItemContent, useItemContent };
