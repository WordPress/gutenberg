/**
 * External dependencies
 */
import classnames from 'classnames';

function BaseControl( { id, label, help, className, children } ) {
	return (
		<div className={ classnames( 'components-base-control', className ) }>
			<div className="components-base-control__field">
				{ label && id && <label className="components-base-control__label" htmlFor={ id }>{ label }</label> }
				{ label && ! id && <span className="components-base-control__label">{ label }</span> }
				{ children }
			</div>
			{ !! help && <p id={ id + '__help' } className="components-base-control__help">{ help }</p> }
		</div>
	);
}

export default BaseControl;
