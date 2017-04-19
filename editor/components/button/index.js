/**
 * External dependencies
 */
import './style.scss';
import classnames from 'classnames';

function Button( { isPrimary, isLarge, isActive, className, ...additionalProps } ) {
	const classes = classnames( 'editor-button', className, {
		button: ( isPrimary || isLarge ),
		'button-primary': isPrimary,
		'button-large': isLarge,
		'is-active': isActive
	} );

	return (
		<button
			type="button"
			{ ...additionalProps }
			className={ classes } />
	);
}

export default Button;
