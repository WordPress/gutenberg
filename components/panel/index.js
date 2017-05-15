/**
 * Internal dependencies
 */
import './style.scss';

function Panel( { children } ) {
	return (
		<div className="components-panel">
			{ children }
		</div>
	);
}

export default Panel;
