import clsx from 'clsx';
import * as Ariakit from '@ariakit/react';
import { forwardRef, useContext } from '@wordpress/element';
import { Icon } from '@wordpress/icons';
import { SVG, Circle } from '@wordpress/primitives';
import type { WordPressComponentProps } from '../context';
import { Context } from './context';
import type { RadioItemProps } from './types';
import styles from './style.module.scss';
import { useMenuItemHideOnClick } from './use-menu-item-hide-on-click';

const radioCheck = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle cx={ 12 } cy={ 12 } r={ 3 }></Circle>
	</SVG>
);

export const RadioItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< RadioItemProps, 'div', false >
>( function UnforwardedRadioItem(
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
			'Menu.RadioItem can only be rendered inside a Menu component'
		);
	}
	return (
		<Ariakit.MenuItemRadio
			ref={ ref }
			{ ...props }
			className={ clsx( styles.item, styles[ 'radio-item' ], className ) }
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
				<Icon icon={ radioCheck } size={ 24 } />
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
		</Ariakit.MenuItemRadio>
	);
} );
