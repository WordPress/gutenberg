/**
 * WordPress dependencies
 */
import { Icon as WCIcon } from '@wordpress/components';

function InserterPanel( { title, icon, children } ) {
	return (
		<>
			<div className="block-editor-inserter__panel-header">
				<h2 className="block-editor-inserter__panel-title">
					{ title }
				</h2>
				<WCIcon icon={ icon } />
			</div>
			<div className="block-editor-inserter__panel-content">
				{ children }
			</div>
		</>
	);
}

export default InserterPanel;
