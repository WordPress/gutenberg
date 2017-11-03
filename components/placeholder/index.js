/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import Dashicon from '../dashicon';

function Placeholder( { icon, children, label, instructions, className, ...additionalProps } ) {
	const classes = classnames( 'components-placeholder', className );

	return (
		<div { ...additionalProps } className={ classes }>
			<div className="components-placeholder__label">
				{ !! icon && <Dashicon icon={ icon } /> }
				{ label }
			</div>
			{ !! instructions && <div className="components-placeholder__instructions">{ instructions }</div> }
			<div className="components-placeholder__fieldset">
				{ children }
			</div>
		</div>
	);
}

export default Placeholder;
