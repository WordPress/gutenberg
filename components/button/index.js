/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

function Button( {
	href,
	target,
	isPrimary,
	isLarge,
	isSmall,
	isToggled,
	className,
	disabled,
	...additionalProps
} ) {
	const classes = classnames( 'components-button', className, {
		button: ( isPrimary || isLarge ),
		'button-primary': isPrimary,
		'button-large': isLarge,
		'button-small': isSmall,
		'is-toggled': isToggled,
	} );

	const tag = href !== undefined && ! disabled ? 'a' : 'button';
	const tagProps = tag === 'a' ? { href, target } : { type: 'button', disabled };

	return createElement( tag, {
		...tagProps,
		...additionalProps,
		className: classes,
	} );
}

export default Button;
