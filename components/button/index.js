/**
 * External dependencies
 */
import './style.scss';
import classnames from 'classnames';

function Button( { href, target, isPrimary, isLarge, isToggled, className, disabled, ...additionalProps } ) {
	const classes = classnames( 'components-button', className, {
		button: ( isPrimary || isLarge ),
		'button-primary': isPrimary,
		'button-large': isLarge,
		'is-toggled': isToggled,
	} );

	const tag = href !== undefined && ! disabled ? 'a' : 'button';
	const tagProps = tag === 'a' ? { href, target } : { type: 'button', disabled };

	return wp.element.createElement( tag, {
		...tagProps,
		...additionalProps,
		className: classes,
	} );
}

export default Button;
