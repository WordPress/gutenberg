/**
 * Internal dependencies
 */
import './style.scss';

function PanelBody( { children } ) {
	return (
		<div className="components-panel-body">
			{ children }
		</div>
	);
}

export default PanelBody;
