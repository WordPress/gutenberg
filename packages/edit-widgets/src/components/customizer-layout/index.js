/**
 * WordPress dependencies
 */
import {
	SlotFillProvider,
	Popover,
	navigateRegions,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import WidgetAreas from '../widget-areas';
import { withWPCustomize } from '../../utils';

function CustomizerLayout( { blockEditorSettings } ) {
	return (
		<SlotFillProvider>
			<Notices />
			<div
				className="edit-widgets-customizer-layout__content"
				role="region"
				aria-label={ __( 'Widgets screen content' ) }
				tabIndex="-1"
			>
				<WidgetAreas
					blockEditorSettings={ blockEditorSettings }
					onUpdateBlocks={ useCallback(
						( id, blocks ) =>
							withWPCustomize( ( { previewBlocksInWidgetArea, saveButton } ) => {
								previewBlocksInWidgetArea( id, blocks );
								saveButton.disabled = false;
							} ),
						[]
					) }
				/>
			</div>
			<Popover.Slot />
		</SlotFillProvider>
	);
}

export default navigateRegions( CustomizerLayout );
