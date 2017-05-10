/**
 * External dependencies
 */
import './style.scss';
import classnames from 'classnames';

function Button( { href, isPrimary, isLarge, isToggled, className, buttonRef, ...additionalProps } ) {
	const classes = classnames( 'components-button', className, {
		button: ( isPrimary || isLarge ),
		'button-primary': isPrimary,
		'button-large': isLarge,
		'is-toggled': isToggled,
	} );

	const tag = href !== undefined ? 'a' : 'button';
	const tagProps = tag === 'a' ? { href } : { type: 'button' };

	return wp.element.createElement( tag, {
		...tagProps,
		...additionalProps,
		className: classes,
		ref: buttonRef,
	} );
}

export default Button;
