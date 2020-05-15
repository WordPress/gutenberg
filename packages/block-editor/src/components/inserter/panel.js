/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

function InserterPanel( { title, icon, children } ) {
	return (
		<>
			<div className="block-editor-inserter__panel-header">
				<span className="block-editor-inserter__panel-title">
					{ title }
				</span>
				<Icon icon={ icon } />
			</div>
			<div className="block-editor-inserter__panel-content">
				{ children }
			</div>
		</>
	);
}

export default InserterPanel;
