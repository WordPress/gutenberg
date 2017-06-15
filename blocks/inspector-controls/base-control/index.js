/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

function BaseControl( { id, label, classes, children, ...props } ) {
	return (
		<div className={ classnames( 'blocks-base-control', classes ) } { ...props }>
			{ label && <label className="blocks-base-control__label" htmlFor={ id }>{ label }</label> }
			{ children }
		</div>
	);
}

export default BaseControl;
