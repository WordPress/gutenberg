/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

function BaseControl( { id, label, description, className, children } ) {
	return (
		<div className={ classnames( 'blocks-base-control', className ) }>
			{ label && <label className="blocks-base-control__label" htmlFor={ id }>{ label }</label> }
			{ children }
			{ description && <p className="blocks-base-control__description">{ description }</p> }
		</div>
	);
}

export default BaseControl;
