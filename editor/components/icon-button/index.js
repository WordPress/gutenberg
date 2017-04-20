/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import Button from '../button';
import Dashicon from '../dashicon';

function IconButton( {
	icon, children, label, className, tooltip,
	...additionalProps
} ) {
	const classes = classnames( 'editor-icon-button', className );

	return (
		<Button
			{ ...additionalProps }
			aria-label={ label }
			className={ classes }
			title={ tooltip }
		>
			<Dashicon icon={ icon } />
			{ children }
		</Button>
	);
}

export default IconButton;
