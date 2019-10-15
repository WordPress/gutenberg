/**
 * WordPress dependencies
 */
import {
	SlotFillProvider,
	Popover,
	navigateRegions,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ViewportMatchWidthProvider } from '@wordpress/viewport';
import { __experimentalSimulateMediaQuery } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import WidgetAreas from '../widget-areas';

import './sync-customizer';

const PARTIAL_PATHS = [
	'block-editor/style.css',
	'block-library/style.css',
	'block-library/theme.css',
	'block-library/editor.css',
	'format-library/style.css',
];

const CUSTOMIZER_PANEL_WIDTH = 479;

function CustomizerEditWidgetsInitializer( { settings } ) {
	return (
		<ViewportMatchWidthProvider width={ CUSTOMIZER_PANEL_WIDTH }>
			<__experimentalSimulateMediaQuery
				value={ CUSTOMIZER_PANEL_WIDTH }
				partialPaths={ PARTIAL_PATHS }
			/>
			<SlotFillProvider>
				<div
					className="edit-widgets-customizer-edit-widgets-initializer__content"
					role="region"
					aria-label={ __( 'Widgets screen content' ) }
					tabIndex="-1"
				>
					<WidgetAreas blockEditorSettings={ settings } />
				</div>
				<Popover.Slot />
			</SlotFillProvider>
		</ViewportMatchWidthProvider>
	);
}

export default navigateRegions( CustomizerEditWidgetsInitializer );
