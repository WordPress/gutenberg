/**
 * External dependencies
 */
import classnames from 'classnames';
import { isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Shortcut from '../shortcut';
import Button from '../button';

/**
 * Renders a generic menu item for use inside the more menu.
 *
 * @return {WPComponent} The component to be rendered.
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
	className = classnames( 'components-menu-item__button', className );

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

	if ( icon && ! isString( icon ) ) {
		icon = cloneElement( icon, {
			className: 'components-menu-items__item-icon',
			height: 20,
			width: 20,
		} );
	}

	return (
		<Button
			icon={ icon }
			// Make sure aria-checked matches spec https://www.w3.org/TR/wai-aria-1.1/#aria-checked
			aria-checked={ ( role === 'menuitemcheckbox' || role === 'menuitemradio' ) ? isSelected : undefined }
			role={ role }
			className={ className }
			{ ...props }
		>
			{ children }
			<Shortcut className="components-menu-item__shortcut" shortcut={ shortcut } />
		</Button>
	);
}

export default MenuItem;
