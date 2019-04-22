/**
 * External dependencies
 */
import classnames from 'classnames';
import { isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { createElement, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import Shortcut from '../shortcut';
import IconButton from '../icon-button';

/**
 * Renders a generic menu item for use inside the more menu.
 *
 * @return {WPElement} More menu item.
 */
export function MenuItem( {
	children,
	info,
	className,
	icon,
	shortcut,
	isSelected,
	role = 'menuitem',
	...props
} ) {
	className = classnames( 'components-menu-item__button', className, {
		'has-icon': icon,
	} );

	if ( info ) {
		children = (
			<span className="components-menu-item__info-wrapper">
				{ children }
				<span
					className="components-menu-item__info">
					{ info }
				</span>
			</span>
		);
	}

	let tagName = Button;

	if ( icon ) {
		if ( ! isString( icon ) ) {
			icon = cloneElement( icon, {
				className: 'components-menu-items__item-icon',
				height: 20,
				width: 20,
			} );
		}

		tagName = IconButton;
		props.icon = icon;
	}

	return createElement(
		tagName,
		{
			// Make sure aria-checked matches spec https://www.w3.org/TR/wai-aria-1.1/#aria-checked
			'aria-checked': ( role === 'menuitemcheckbox' || role === 'menuitemradio' ) ? isSelected : undefined,
			role,
			className,
			...props,
		},
		children,
		<Shortcut className="components-menu-item__shortcut" shortcut={ shortcut } />
	);
}

export default MenuItem;
