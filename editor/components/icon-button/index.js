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

function IconButton( { icon, level, children, label, className, ...additionalProps } ) {
	const classes = classnames( 'editor-icon-button', className );

	return (
		<Button { ...additionalProps } aria-label={ label } className={ classes } data-level={ level ? level : null }>
			<Dashicon icon={ icon } />
			{ children }
		</Button>
	);
}

export default IconButton;
