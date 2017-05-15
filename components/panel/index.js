/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

function Panel( { className, children } ) {
	const classNames = classnames( className, 'components-panel' );
	return (
		<div className={ classNames }>
			{ children }
		</div>
	);
}

export default Panel;
