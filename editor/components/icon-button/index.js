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

function IconButton( { icon, label, className, ...additionalProps } ) {
	const classes = classnames( 'editor-icon-button', className );

	return (
		<Button { ...additionalProps } title={ label } className={ classes }>
			<Dashicon icon={ icon } />
		</Button>
	);
}

export default IconButton;
