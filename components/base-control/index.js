/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

function BaseControl( { id, label, help, className, children } ) {
	return (
		<div className={ classnames( 'components-base-control', className ) }>
			{ label && <label className="components-base-control__label" htmlFor={ id }>{ label }</label> }
			{ children }
			{ !! help && <p id={ id + '__help' } className="components-base-control__help">{ help }</p> }
		</div>
	);
}

export default BaseControl;
