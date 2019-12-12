/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { deprecated } from '@wordpress/deprecated';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button as PrimitiveButton, A } from '../styled-primitives/button';

export function Button( {
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
}, ref ) {
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
	const propsToPass = { ...tagProps, ...additionalProps, className: classes, ref };
	if ( tag === 'a' ) {
		return <A { ...propsToPass } />;
	} return <PrimitiveButton { ...propsToPass } />;
}

export default forwardRef( Button );
