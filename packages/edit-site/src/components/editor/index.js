/**
 * WordPress dependencies
 */
import {
	SlotFillProvider,
	DropZoneProvider,
	Popover,
	navigateRegions,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import Header from '../header';
import Sidebar from '../sidebar';
import BlockEditor from '../block-editor';

function Editor( { settings } ) {
	return (
		<SlotFillProvider>
			<DropZoneProvider>
				<Notices />
				<Header />
				<Sidebar />
				<BlockEditor settings={ settings } />
				<Popover.Slot />
			</DropZoneProvider>
		</SlotFillProvider>
	);
}

export default navigateRegions( Editor );
