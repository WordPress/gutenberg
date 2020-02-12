/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	SlotFillProvider,
	DropZoneProvider,
	Popover,
	navigateRegions,
} from '@wordpress/components';
import { EntityProvider } from '@wordpress/core-data';
import { GlobalStylesStateProvider } from '@wordpress/global-styles';

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
		<GlobalStylesStateProvider>
			<SlotFillProvider>
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
			</SlotFillProvider>
		</GlobalStylesStateProvider>
	) : null;
}

export default navigateRegions( Editor );
