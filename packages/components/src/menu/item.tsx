import clsx from 'clsx';
import * as Ariakit from '@ariakit/react';
import { forwardRef, useContext } from '@wordpress/element';
import type { WordPressComponentProps } from '../context';
import type { ItemProps } from './types';
import styles from './style.module.scss';
import { Context } from './context';
import { useMenuItemHideOnClick } from './use-menu-item-hide-on-click';

export const Item = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< ItemProps, 'div', false >
>( function UnforwardedItem(
	{
		className,
		prefix,
		suffix,
		children,
		disabled = false,
		hideOnClick = true,
		store,
		...props
	},
	ref
) {
	const menuContext = useContext( Context );
	const computedStore = store ?? menuContext?.store;
	const computedHideOnClick = useMenuItemHideOnClick(
		computedStore,
		hideOnClick
	);

	if ( ! menuContext?.store || ! computedStore ) {
		throw new Error(
			'Menu.Item can only be rendered inside a Menu component'
		);
	}

	// In most cases, the menu store will be retrieved from context (ie. the store
	// created by the top-level menu component). But in rare cases (ie.
	// `Menu.SubmenuTriggerItem`), the context store wouldn't be correct. This is
	// why the component accepts a `store` prop to override the context store.
	return (
		<Ariakit.MenuItem
			ref={ ref }
			{ ...props }
			className={ clsx( styles.item, className ) }
			accessibleWhenDisabled
			disabled={ disabled }
			store={ computedStore }
			hideOnClick={ computedHideOnClick }
		>
			<span className={ styles[ 'item-prefix-wrapper' ] }>
				{ prefix }
			</span>

			<div className={ styles[ 'item-content-wrapper' ] }>
				<div className={ styles[ 'item-children-wrapper' ] }>
					{ children }
				</div>

				{ suffix && (
					<span className={ styles[ 'item-suffix-wrapper' ] }>
						{ suffix }
					</span>
				) }
			</div>
		</Ariakit.MenuItem>
	);
} );
