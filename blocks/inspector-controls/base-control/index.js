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
		<div className={ classnames( 'blocks-base-control', className ) }>
			{ label && <label className="blocks-base-control__label" htmlFor={ id }>{ label }</label> }
			{ children }
			{ !! help && <p className="blocks-base-control__help">{ help }</p> }
		</div>
	);
}

export default BaseControl;
