/**
 * Internal dependencies
 */
import './style.scss';

function PanelHeader( { children } ) {
	return (
		<div className="components-panel-header">
			{ children }
		</div>
	);
}

export default PanelHeader;
