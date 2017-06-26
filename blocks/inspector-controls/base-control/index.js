/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

function BaseControl( { id, label, className, children } ) {
	return (
		<div className={ classnames( 'blocks-base-control', className ) }>
			{ label && <label className="blocks-base-control__label" htmlFor={ id }>{ label }</label> }
			{ children }
		</div>
	);
}

export default BaseControl;
