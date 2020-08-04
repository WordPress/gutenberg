/**
 * WordPress dependencies
 */
import {
	DropZoneProvider,
	SlotFillProvider,
	FocusReturnProvider,
	Popover,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { BlockEditorKeyboardShortcuts } from '@wordpress/block-editor';
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import KeyboardShortcuts from '../keyboard-shortcuts';
import Header from '../header';
import Sidebar from '../sidebar';
import WidgetAreasBlockEditorContent from '../widget-areas-block-editor-content';

function Layout( { blockEditorSettings } ) {
	const hasSidebarEnabled = useSelect( ( select ) => {
		return !! select( 'core/interface' ).getActiveComplementaryArea(
			'core/edit-widgets'
		);
	} );
	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />
			<KeyboardShortcuts.Register />
			<SlotFillProvider>
				<DropZoneProvider>
					<FocusReturnProvider>
						<InterfaceSkeleton
							header={ <Header /> }
							sidebar={
								hasSidebarEnabled && (
									<ComplementaryArea.Slot scope="core/edit-widgets" />
								)
							}
							content={
								<WidgetAreasBlockEditorContent
									blockEditorSettings={ blockEditorSettings }
								/>
							}
						/>
						<Sidebar />
						<Popover.Slot />
					</FocusReturnProvider>
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	);
}

export default Layout;
