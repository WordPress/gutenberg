import { Icon as WCIcon } from '@wordpress/components';
import type { IconType } from '@wordpress/components';
import type { InserterPanelProps } from './types';

function InserterPanel( { title, icon, children }: InserterPanelProps ) {
	return (
		<>
			<div className="block-editor-inserter__panel-header">
				<h2 className="block-editor-inserter__panel-title">
					{ title }
				</h2>
				{ /* Icons are Dashicon names, elements or components. */ }
				<WCIcon icon={ icon as IconType } />
			</div>
			<div className="block-editor-inserter__panel-content">
				{ children }
			</div>
		</>
	);
}

export default InserterPanel;
