/**
 * WordPress dependencies
 */
import { navigateRegions } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSimulatedMediaQuery } from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import './sync-customizer';
import WidgetAreasBlockEditorProvider from '../widget-areas-block-editor-provider';
import WidgetAreasBlockEditorContent from '../widget-areas-block-editor-content';

function CustomizerEditWidgetsInitializer( { settings } ) {
	useSimulatedMediaQuery( 'resizable-editor-section', 360 );
	return (
		<useViewportMatch.__experimentalWidthProvider value={ 360 }>
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
		</useViewportMatch.__experimentalWidthProvider>
	);
}

export default navigateRegions( CustomizerEditWidgetsInitializer );
