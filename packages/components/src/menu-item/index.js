/**
 * External dependencies
 */
import classnames from 'classnames';
import { isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { cloneElement, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Shortcut from '../shortcut';
import Button from '../button';
import Icon from '../icon';

/**
 * Renders a generic menu item for use inside the more menu.
 *
 * @param {Object}        props                   Component props.
 * @param {WPElement}     props.children          Element to render as child of button.
 * @param {string}        props.info              Text to use as description for button text.
 * @param {string}        props.className         Class to set on the container.
 * @param {WPIcon}        props.icon              Button's `icon` prop.
 * @param {string|Object} props.shortcut          Shortcut's `shortcut` prop.
 * @param {boolean}       props.isSelected        Whether or not the menu item is currently selected.
 * @param {string}        [props.role="menuitem"] ARIA role of the menu item.
 * @param {Object}        ref                     React Element ref.
 *
 * @return {WPComponent} The component to be rendered.
 */
export function MenuItem(
	{
		children,
		info,
		className,
		icon,
		shortcut,
		isSelected,
		role = 'menuitem',
		...props
	},
	ref
) {
	className = classnames( 'components-menu-item__button', className );

	if ( info ) {
		children = (
			<span className="components-menu-item__info-wrapper">
				<span className="components-menu-item__item">{ children }</span>
				<span className="components-menu-item__info">{ info }</span>
			</span>
		);
	}

	if ( icon && ! isString( icon ) ) {
		icon = cloneElement( icon, {
			className: 'components-menu-items__item-icon',
		} );
	}

	return (
		<Button
			ref={ ref }
			// Make sure aria-checked matches spec https://www.w3.org/TR/wai-aria-1.1/#aria-checked
			aria-checked={
				role === 'menuitemcheckbox' || role === 'menuitemradio'
					? isSelected
					: undefined
			}
			role={ role }
			className={ className }
			{ ...props }
		>
			<span className="components-menu-item__item">{ children }</span>
			<Shortcut
				className="components-menu-item__shortcut"
				shortcut={ shortcut }
			/>
			{ icon && <Icon icon={ icon } /> }
		</Button>
	);
}

export default forwardRef( MenuItem );
