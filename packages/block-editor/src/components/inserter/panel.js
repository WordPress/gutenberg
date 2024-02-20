/**
 * WordPress dependencies
 */
import { Icon, VisuallyHidden } from '@wordpress/components';

function InserterPanel( { title, icon, children } ) {
	const isVisuallyHidden = title.type && title.type === VisuallyHidden;
	return (
		<>
			<div
				className={
					isVisuallyHidden === true
						? 'block-editor-inserter__hidden-panel-header'
						: 'block-editor-inserter__panel-header'
				}
			>
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

export default InserterPanel;
