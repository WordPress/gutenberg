/**
 * WordPress dependencies
 */
import { navigateRegions } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './sync-customizer';
import WidgetAreasBlockEditorProvider from '../widget-areas-block-editor-provider';
import WidgetAreasBlockEditorContent from '../widget-areas-block-editor-content';

function CustomizerEditWidgetsInitializer( { settings } ) {
	return (
		<WidgetAreasBlockEditorProvider blockEditorSettings={ settings }>
			<div
				className="edit-widgets-customizer-edit-widgets-initializer__content"
				role="region"
				aria-label={ __( 'Widgets screen content' ) }
				tabIndex="-1"
			>
				<WidgetAreasBlockEditorContent />
			</div>
		</WidgetAreasBlockEditorProvider>
	);
}

export default navigateRegions( CustomizerEditWidgetsInitializer );
