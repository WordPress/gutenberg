/**
 * External dependencies
 */
import type { ReactNode, ReactElement, ComponentProps } from 'react';

/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';

function getClickableItemProps< Item >( {
	item,
	isItemClickable,
	onClickItem,
	className,
}: {
	item: Item;
	isItemClickable: ( item: Item ) => boolean;
	onClickItem?: ( item: Item ) => void;
	className?: string;
} ) {
	if ( ! isItemClickable( item ) || ! onClickItem ) {
		return { className };
	}

	return {
		className: className
			? `${ className } ${ className }--clickable`
			: undefined,
		role: 'button',
		tabIndex: 0,
		onClick: ( event: React.MouseEvent ) => {
			// Prevents onChangeSelection from triggering.
			event.stopPropagation();
			onClickItem( item );
		},
		onKeyDown: ( event: React.KeyboardEvent ) => {
			if (
				event.key === 'Enter' ||
				event.key === '' ||
				event.key === ' '
			) {
				// Prevents onChangeSelection from triggering.
				event.stopPropagation();
				onClickItem( item );
			}
		},
	};
}

export function ItemClickWrapper< Item >( {
	item,
	isItemClickable,
	onClickItem,
	renderItemLink,
	className,
	children,
	...extraProps
}: {
	item: Item;
	isItemClickable: ( item: Item ) => boolean;
	onClickItem?: ( item: Item ) => void;
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;
	className?: string;
	title?: string;
	children: ReactNode;
} ) {
	// Always render a wrapper element so layout and styling relying on the wrapper
	// still works even if the item is not clickable.
	if ( ! isItemClickable( item ) ) {
		return (
			<div className={ className } { ...extraProps }>
				{ children }
			</div>
		);
	}

	// If we have a renderItemLink, use it
	if ( renderItemLink ) {
		const renderedElement = renderItemLink( {
			item,
			className: `${ className } ${ className }--clickable`,
			...extraProps,
			children,
		} );

		// Clone the element and enhance onClick to stop propagation
		return cloneElement( renderedElement, {
			onClick: ( event: React.MouseEvent ) => {
				// Always stop propagation to prevent selection
				event.stopPropagation();

				// If consumer provided an onClick, call it
				if ( renderedElement.props.onClick ) {
					renderedElement.props.onClick( event );
				}
			},
			onKeyDown: ( event: React.KeyboardEvent ) => {
				if (
					event.key === 'Enter' ||
					event.key === '' ||
					event.key === ' '
				) {
					// Prevents onChangeSelection from triggering.
					event.stopPropagation();
					// If consumer provided an onKeyDown, call it
					if ( renderedElement.props.onKeyDown ) {
						renderedElement.props.onKeyDown( event );
					}
				}
			},
		} );
	}

	// Otherwise use the classic click handler approach
	const clickProps = getClickableItemProps( {
		item,
		isItemClickable,
		onClickItem,
		className,
	} );

	return (
		<div { ...clickProps } { ...extraProps }>
			{ children }
		</div>
	);
}
