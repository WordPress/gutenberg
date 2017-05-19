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

function IconButton( { icon, children, className, ...additionalProps } ) {
	const classes = classnames( 'components-icon-button', className );

	return (
		<Button { ...additionalProps } className={ classes }>
			<Dashicon icon={ icon } />
			{ children }
		</Button>
	);
}

export default IconButton;
