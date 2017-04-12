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

function IconButton( { icon, label, onClick, className } ) {
	const classes = classnames( 'editor-icon-button', className );

	return (
		<Button
			title={ label }
			onClick={ onClick }
			className={ classes }
		>
			<Dashicon icon={ icon } />
		</Button>
	);
}

export default IconButton;
