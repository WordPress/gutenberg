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

function IconButton( { icon, children, label, className, ...additionalProps } ) {
	const classes = classnames( 'editor-icon-button', className );

	return (
		<Button { ...additionalProps } aria-label={ label } className={ classes }>
			<Dashicon icon={ icon } />
			{ children ? <span>{ children }</span> : null }
		</Button>
	);
}

export default IconButton;
