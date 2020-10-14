/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

function InserterPanel( { title, icon } ) {
	return (
		<div className="block-editor-inserter__panel-header">
			<h2 className="block-editor-inserter__panel-title">{ title }</h2>
			<Icon icon={ icon } />
		</div>
	);
}

export default InserterPanel;
