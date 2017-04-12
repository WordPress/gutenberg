/**
 * External dependencies
 */
import './style.scss';
import classnames from 'classnames';

function Button( { type = 'button', isPrimary, isLarge, onClick, className, children } ) {
	const classes = classnames( 'editor-button', className, {
		button: ( isPrimary || isLarge ),
		'button-primary': isPrimary,
		'button-large': isLarge
	} );

	return (
		<button
			type={ type }
			onClick={ onClick }
			className={ classes }>
			{ children }
		</button>
	);
}

export default Button;
