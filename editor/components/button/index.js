/**
 * External dependencies
 */
import './style.scss';
import classnames from 'classnames';

function Button( { isPrimary, isLarge, className, ...additionalProps } ) {
	const classes = classnames( 'editor-button', className, {
		button: ( isPrimary || isLarge ),
		'button-primary': isPrimary,
		'button-large': isLarge
	} );

	return (
		<button
			type="button"
			{ ...additionalProps }
			className={ classes } />
	);
}

export default Button;
