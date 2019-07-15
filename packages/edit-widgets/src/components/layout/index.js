/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	navigateRegions,
	Popover,
	SlotFillProvider,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import Header from '../header';
import Sidebar from '../sidebar';
import WidgetAreas from '../widget-areas';
import Notices from '../notices';

function Layout( { blockEditorSettings } ) {
	return (
		<SlotFillProvider>
			<Header />
			<Sidebar />
			<Notices />
			<div
				className="edit-widgets-layout__content"
				role="region"
				aria-label={ __( 'Widgets screen content' ) }
				tabIndex="-1"
			>
				<WidgetAreas
					blockEditorSettings={ blockEditorSettings }
				/>
			</div>
			<Popover.Slot />
		</SlotFillProvider>
	);
}

export default navigateRegions( Layout );
