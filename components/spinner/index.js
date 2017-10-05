/**
 * External dependencies
 */
import classnames from 'classnames';

function Spinner( { className } ) {
	return <span className={ classnames( 'spinner', 'is-active', className ) } />;
}

export default Spinner;
