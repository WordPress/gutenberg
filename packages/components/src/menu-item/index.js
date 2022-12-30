// @ts-nocheck
/**
 * External dependencies
 */
import classnames from 'classnames';

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

export function MenuItem( props, ref ) {
	let {
		children,
		info,
		className,
		icon,
		iconPosition = 'right',
		shortcut,
		isSelected,
		role = 'menuitem',
		suffix,
		...buttonProps
	} = props;

	className = classnames( 'components-menu-item__button', className );

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
			className: classnames( 'components-menu-items__item-icon', {
				'has-icon-right': iconPosition === 'right',
			} ),
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
			icon={ iconPosition === 'left' ? icon : undefined }
			className={ className }
			{ ...buttonProps }
		>
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

export default forwardRef( MenuItem );
