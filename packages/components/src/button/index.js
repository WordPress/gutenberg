/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { createElement, forwardRef } from '@wordpress/element';

export function Button( props, ref ) {
	const {
		href,
		target,
		isPrimary,
		isLarge,
		isSmall,
		isTertiary,
		isPressed,
		isBusy,
		isDefault,
		isSecondary,
		isLink,
		isDestructive,
		className,
		disabled,
		...additionalProps
	} = props;

	if ( isDefault ) {
		deprecated( 'Button isDefault prop', {
			alternative: 'isSecondary',
		} );
	}

	const classes = classnames( 'components-button', className, {
		'is-secondary': isDefault || isSecondary,
		'is-primary': isPrimary,
		'is-large': isLarge,
		'is-small': isSmall,
		'is-tertiary': isTertiary,
		'is-pressed': isPressed,
		'is-busy': isBusy,
		'is-link': isLink,
		'is-destructive': isDestructive,
	} );

	const tag = href !== undefined && ! disabled ? 'a' : 'button';
	const tagProps = tag === 'a' ?
		{ href, target } :
		{ type: 'button', disabled, 'aria-pressed': isPressed };

	return createElement( tag, {
		...tagProps,
		...additionalProps,
		className: classes,
		ref,
	} );
}

export default forwardRef( Button );
