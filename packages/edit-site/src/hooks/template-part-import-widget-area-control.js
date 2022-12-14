/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorAdvancedControls } from '@wordpress/block-editor';
import { TemplatePartImportWidgetAreaControl } from '@wordpress/widgets';
import { addFilter } from '@wordpress/hooks';

const withTemplatePartImportWidgetAreaControl = createHigherOrderComponent(
	( BlockEdit ) => ( props ) =>
		(
			<>
				<BlockEdit { ...props } />
				<InspectorAdvancedControls>
					<TemplatePartImportWidgetAreaControl { ...props } />
				</InspectorAdvancedControls>
			</>
		)
);

addFilter(
	'editor.BlockEdit',
	'core/edit-site/template-part-import-widget-area-control',
	withTemplatePartImportWidgetAreaControl
);
