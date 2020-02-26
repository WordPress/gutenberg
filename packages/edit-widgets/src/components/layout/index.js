/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	navigateRegions,
	DropZoneProvider,
	Popover,
	SlotFillProvider,
	FocusReturnProvider,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import {
	BlockEditorKeyboardShortcuts,
	__experimentalEditorSkeleton as EditorSkeleton,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Header from '../header';
import Sidebar from '../sidebar';
import WidgetAreas from '../widget-areas';
import Notices from '../notices';

function Layout( { blockEditorSettings } ) {
	const [ selectedArea, setSelectedArea ] = useState( null );
	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />
			<SlotFillProvider>
				<DropZoneProvider>
					<FocusReturnProvider>
						<EditorSkeleton
							header={ <Header /> }
							sidebar={ <Sidebar /> }
							content={
								<>
									<Notices />
									<div
										className="edit-widgets-layout__content"
										role="region"
										aria-label={ __(
											'Widgets screen content'
										) }
										tabIndex="-1"
										onFocus={ () => {
											setSelectedArea( null );
										} }
									>
										<WidgetAreas
											selectedArea={ selectedArea }
											setSelectedArea={ setSelectedArea }
											blockEditorSettings={
												blockEditorSettings
											}
										/>
									</div>
								</>
							}
						/>

						<Popover.Slot />
					</FocusReturnProvider>
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	);
}

export default navigateRegions( Layout );
