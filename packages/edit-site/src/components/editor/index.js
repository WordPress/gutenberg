/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	SlotFillProvider,
	__experimentalSlotFillProvider as SlotFillProvider2,
	DropZoneProvider,
	Popover,
	navigateRegions,
} from '@wordpress/components';
import { EntityProvider } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import Header from '../header';
import Sidebar from '../sidebar';
import BlockEditor from '../block-editor';

function Editor( { settings } ) {
	const template = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecord(
				'postType',
				'wp_template',
				settings.templateId
			),
		[]
	);
	return template ? (
		<SlotFillProvider>
			<SlotFillProvider2>
				<DropZoneProvider>
					<EntityProvider
						kind="postType"
						type="wp_template"
						id={ settings.templateId }
					>
						<Notices />
						<Header />
						<Sidebar />
						<BlockEditor settings={ settings } />
						<Popover.Slot />
					</EntityProvider>
				</DropZoneProvider>
			</SlotFillProvider2>
		</SlotFillProvider>
	) : null;
}

export default navigateRegions( Editor );
