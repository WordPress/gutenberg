import type { ForwardedRef } from 'react';
import clsx from 'clsx';
import { cloneElement, forwardRef } from '@wordpress/element';
import { check } from '@wordpress/icons';
import Shortcut from '../shortcut';
import Button from '../button';
import Icon from '../icon';
import type { WordPressComponentProps } from '../context';
import type { MenuItemProps } from './types';
import selectionStyles from './selection-style.module.scss';

function UnforwardedMenuItem(
	props: WordPressComponentProps< MenuItemProps, 'button', false >,
	ref: ForwardedRef< HTMLButtonElement >
) {
	let {
		children,
		info,
		className,
		icon,
		iconPosition = 'right',
		shortcut,
		isSelected,
		showSelectionIndicator = false,
		onMouseMove,
		role = 'menuitem',
		suffix,
		...buttonProps
	} = props;

	const hasSelectionIndicator =
		showSelectionIndicator &&
		( role === 'menuitemcheckbox' || role === 'menuitemradio' );
	className = clsx( 'components-menu-item__button', className, {
		[ selectionStyles.item ]: hasSelectionIndicator,
	} );

	if ( info ) {
		children = (
			<span className="components-menu-item__info-wrapper">
				<span className="components-menu-item__item">{ children }</span>
				<span className="components-menu-item__info">{ info }</span>
			</span>
		);
	}

	if ( icon && typeof icon !== 'string' ) {
		icon = cloneElement( icon, {
			className: clsx( 'components-menu-items__item-icon', {
				'has-icon-right': iconPosition === 'right',
			} ),
		} );
	}

	return (
		<Button
			size="compact"
			ref={ ref }
			// Make sure aria-checked matches spec https://www.w3.org/TR/wai-aria-1.1/#aria-checked
			aria-checked={
				role === 'menuitemcheckbox' || role === 'menuitemradio'
					? isSelected
					: undefined
			}
			role={ role }
			icon={
				iconPosition === 'left' && ! hasSelectionIndicator
					? icon
					: undefined
			}
			className={ className }
			accessibleWhenDisabled
			{ ...buttonProps }
			onMouseMove={ ( event: React.MouseEvent< HTMLButtonElement > ) => {
				onMouseMove?.( event );
				const menu = event.currentTarget.closest( '[role="menu"]' );
				if (
					! event.defaultPrevented &&
					role.startsWith( 'menuitem' ) &&
					menu?.contains(
						event.currentTarget.ownerDocument.activeElement
					)
				) {
					event.currentTarget.focus( { preventScroll: true } );
				}
			} }
		>
			{ hasSelectionIndicator && (
				<Icon
					icon={ check }
					className={ clsx(
						'components-menu-items__item-icon',
						selectionStyles.indicator
					) }
				/>
			) }
			{ hasSelectionIndicator && icon && iconPosition === 'left' && (
				<Icon icon={ icon } />
			) }
			<span className="components-menu-item__item">{ children }</span>
			{ ! suffix && (
				<Shortcut
					className="components-menu-item__shortcut"
					shortcut={ shortcut }
				/>
			) }
			{ ! suffix && icon && iconPosition === 'right' && (
				<Icon icon={ icon } />
			) }
			{ suffix }
		</Button>
	);
}

/**
 * MenuItem is a component which renders a button intended to be used in combination with the `DropdownMenu` component.
 *
 * ```jsx
 * import { MenuItem } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyMenuItem = () => {
 * 	const [ isActive, setIsActive ] = useState( true );
 *
 * 	return (
 * 		<MenuItem
 * 			showSelectionIndicator
 * 			isSelected={ isActive }
 * 			role="menuitemcheckbox"
 * 			onClick={ () => setIsActive( ( state ) => ! state ) }
 * 		>
 * 			Toggle
 * 		</MenuItem>
 * 	);
 * };
 * ```
 */
export const MenuItem = forwardRef( UnforwardedMenuItem );
MenuItem.displayName = 'MenuItem';

export default MenuItem;
