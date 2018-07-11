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
import ExternalLink from '../external-link';

export function Button( props, ref ) {
	const {
		href,
		target,
		isPrimary,
		isLarge,
		isSmall,
		isToggled,
		isBusy,
		isDefault,
		isLink,
		isDestructive,
		isExternalLink,
		className,
		disabled,
		focus,
		...additionalProps
	} = props;

	const classes = classnames( 'components-button', className, {
		'is-button': isDefault || isPrimary || isLarge || isSmall,
		'is-default': isDefault || isLarge || isSmall,
		'is-primary': isPrimary,
		'is-large': isLarge,
		'is-small': isSmall,
		'is-toggled': isToggled,
		'is-busy': isBusy,
		'is-link': isLink,
		'is-destructive': isDestructive,
	} );

	let tag;
	let tagProps;

	if ( href !== undefined && ! disabled ) {
		if ( isExternalLink ) {
			tag = ExternalLink;
			tagProps = { href, target, iconClassName: 'components-button__icon' };
		} else {
			tag = 'a';
			tagProps = { href, target };
		}
	} else {
		tag = 'button';
		tagProps = { type: 'button', disabled };
	}

	return createElement( tag, {
		...tagProps,
		...additionalProps,
		className: classes,
		autoFocus: focus,
		ref,
	} );
}

export default forwardRef( Button );
