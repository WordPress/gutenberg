/**
 * WordPress dependencies
 */
import {
	SlotFillProvider,
	Popover,
	navigateRegions,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WidgetAreas from '../widget-areas';

import './sync-customizer';

function CustomizerEditWidgetsInitializer( { settings } ) {
	return (
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
	);
}

export default navigateRegions( CustomizerEditWidgetsInitializer );
