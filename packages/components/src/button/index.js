/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
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
	isLink,
	isDestructive,
	className,
	disabled,
	...additionalProps
}, ref ) {
	const classes = classnames( 'components-button', className, {
		'is-button': isDefault || isPrimary || isLarge || isSmall,
		'is-default': isDefault || ( ! isPrimary && ( isLarge || isSmall ) ),
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
