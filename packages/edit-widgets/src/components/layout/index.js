/**
 * WordPress dependencies
 */
import {
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
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Header from '../header';
import Sidebar from '../sidebar';
import WidgetAreas from '../widget-areas';
import Notices from '../notices';

function Layout( { blockEditorSettings } ) {
	const [ selectedArea, setSelectedArea ] = useState( null );
	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />
			<SlotFillProvider>
				<DropZoneProvider>
					<FocusReturnProvider>
						<EditorSkeleton
							header={ <Header /> }
							sidebar={ ! isMobile && <Sidebar /> }
							content={
								<>
									<Notices />
									<Popover.Slot name="block-toolbar" />
									<div
										className="edit-widgets-layout__content"
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

export default Layout;
