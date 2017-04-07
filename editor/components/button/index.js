/**
 * External dependencies
 */
import './style.scss';
import classnames from 'classnames';

function Button( { type = 'button', isPrimary, isLarge, className, children } ) {
	const classes = classnames( 'editor-button', className, {
		button: ( isPrimary || isLarge ),
		'button-primary': isPrimary,
		'button-large': isLarge
	} );

	return (
		<button type={ type } className={ classes }>
			{ children }
		</button>
	);
}

export default Button;
