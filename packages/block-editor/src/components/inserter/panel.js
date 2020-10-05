/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { memo } from '@wordpress/element';

function InserterPanel( { title, icon, children } ) {
	return (
		<>
			<div className="block-editor-inserter__panel-header">
				<h2 className="block-editor-inserter__panel-title">
					{ title }
				</h2>
				<Icon icon={ icon } />
			</div>
			<div className="block-editor-inserter__panel-content">
				{ children }
			</div>
		</>
	);
}

const memoizedInserterPanel = memo( InserterPanel );

export default memoizedInserterPanel;
