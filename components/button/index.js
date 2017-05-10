/**
 * External dependencies
 */
import './style.scss';
import classnames from 'classnames';

function Button( { isPrimary, isLarge, isToggled, className, buttonRef, ...additionalProps } ) {
	const classes = classnames( 'components-button', className, {
		button: ( isPrimary || isLarge ),
		'button-primary': isPrimary,
		'button-large': isLarge,
		'is-toggled': isToggled
	} );

	return (
		<button
			type="button"
			{ ...additionalProps }
			ref={ buttonRef }
			className={ classes } />
	);
}

export default Button;
