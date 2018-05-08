/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createElement, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

export function Button( props, ref ) {
	const {
		href,
		target,
		rel,
		isPrimary,
		isLarge,
		isSmall,
		isToggled,
		isBusy,
		className,
		disabled,
		focus,
		...additionalProps
	} = props;

	const classes = classnames( 'components-button', className, {
		button: ( isPrimary || isLarge || isSmall ),
		'button-primary': isPrimary,
		'button-large': isLarge,
		'button-small': isSmall,
		'is-toggled': isToggled,
		'is-busy': isBusy,
	} );

	const tag = href !== undefined && ! disabled ? 'a' : 'button';
	const tagProps = tag === 'a' ? { href, target, rel } : { type: 'button', disabled };

	return createElement( tag, {
		...tagProps,
		...additionalProps,
		className: classes,
		autoFocus: focus,
		ref,
	} );
}

export default forwardRef( Button );
