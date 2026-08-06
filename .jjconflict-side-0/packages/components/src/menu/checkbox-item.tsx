import clsx from 'clsx';
import * as Ariakit from '@ariakit/react';
import { forwardRef, useContext } from '@wordpress/element';
import { Icon, check } from '@wordpress/icons';
import type { WordPressComponentProps } from '../context';
import { Context } from './context';
import type { CheckboxItemProps } from './types';
import styles from './style.module.scss';
import { useMenuItemHideOnClick } from './use-menu-item-hide-on-click';

export const CheckboxItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CheckboxItemProps, 'div', false >
>( function UnforwardedCheckboxItem(
	{
		className,
		suffix,
		children,
		disabled = false,
		hideOnClick = false,
		...props
	},
	ref
) {
	const menuContext = useContext( Context );
	const store = menuContext?.store;
	const computedHideOnClick = useMenuItemHideOnClick( store, hideOnClick );

	if ( ! store ) {
		throw new Error(
			'Menu.CheckboxItem can only be rendered inside a Menu component'
		);
	}
	return (
		<Ariakit.MenuItemCheckbox
			ref={ ref }
			{ ...props }
			className={ clsx(
				styles.item,
				styles[ 'checkbox-item' ],
				className
			) }
			accessibleWhenDisabled
			disabled={ disabled }
			store={ store }
			hideOnClick={ computedHideOnClick }
		>
			<Ariakit.MenuItemCheck
				store={ store }
				render={
					<span className={ styles[ 'item-prefix-wrapper' ] } />
				}
				// Override some ariakit inline styles
				style={ { width: 'auto', height: 'auto' } }
			>
				<Icon icon={ check } size={ 24 } />
			</Ariakit.MenuItemCheck>

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
		</Ariakit.MenuItemCheckbox>
	);
} );
