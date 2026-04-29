/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { Text } from '@wordpress/ui';

function InserterPanel( { title, icon, children } ) {
	return (
		<>
			<div className="block-editor-inserter__panel-header">
				<Text
					render={ <h2 /> }
					variant="heading-sm"
					className="block-editor-inserter__panel-title"
				>
					{ title }
				</Text>
				<Icon icon={ icon } />
			</div>
			<div className="block-editor-inserter__panel-content">
				{ children }
			</div>
		</>
	);
}

export default InserterPanel;
