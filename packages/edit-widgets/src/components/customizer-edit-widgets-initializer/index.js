/**
 * WordPress dependencies
 */
import { navigateRegions } from '@wordpress/components';
import {
	useSimulatedMediaQuery,
	BlockInspector,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { ComplementaryArea } from '@wordpress/interface';
import { cog } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './sync-customizer';
import Header from '../header';
import WidgetAreasBlockEditorProvider from '../widget-areas-block-editor-provider';
import WidgetAreasBlockEditorContent from '../widget-areas-block-editor-content';

function CustomizerEditWidgetsInitializer( { settings } ) {
	useSimulatedMediaQuery( 'resizable-editor-section', 360 );
	const blockEditorSettings = useMemo(
		() => ( {
			...settings,
			hasFixedToolbar: true,
		} ),
		[ settings ]
	);
	return (
		<WidgetAreasBlockEditorProvider
			blockEditorSettings={ blockEditorSettings }
		>
			<div
				className="edit-widgets-customizer-edit-widgets-initializer__content"
				role="region"
				aria-label={ __( 'Widgets screen content' ) }
				tabIndex="-1"
			>
				<Header isCustomizer />
				<WidgetAreasBlockEditorContent />
				<ComplementaryArea.Slot scope="core/edit-widgets-customizer" />
				<ComplementaryArea
					className="edit-widgets-sidebar"
					scope="core/edit-widgets-customizer"
					identifier="edit-widgets-customizer/block-inspector"
					icon={ cog }
					title={ __( 'Block Inspector' ) }
				>
					<BlockInspector />
				</ComplementaryArea>
			</div>
		</WidgetAreasBlockEditorProvider>
	);
}

export default navigateRegions( CustomizerEditWidgetsInitializer );
