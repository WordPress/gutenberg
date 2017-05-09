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
	const classes = classnames( 'placeholder', className );

	return (
		<div { ...additionalProps } aria-label={ label } className={ classes }>
			<div className="placeholder__label">
				<Dashicon icon={ icon } />
				{ label }
			</div>
			{ instructions
				? <div className="placeholder__instructions">{ instructions }</div>
				: ''
			}
			<div className="placeholder__fieldset">
				{ children }
			</div>
		</div>
	);
}

export default Placeholder;
