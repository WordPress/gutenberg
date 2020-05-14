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
	Inserter as BlockEditorInserter,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { InterfaceSkeleton } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import Header from '../header';
import Sidebar from '../sidebar';
import WidgetAreas from '../widget-areas';
import Notices from '../notices';
import KeyboardShortcuts from '../keyboard-shortcuts';
import Inserter from '../inserter';

const disabledInserterToggleProps = { isPrimary: true, disabled: true };

function Layout( { blockEditorSettings } ) {
	const [ selectedArea, setSelectedArea ] = useState( null );
	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />
			<KeyboardShortcuts.Register />
			<SlotFillProvider>
				<DropZoneProvider>
					<FocusReturnProvider>
						<InterfaceSkeleton
							header={ <Header /> }
							sidebar={ ! isMobile && <Sidebar /> }
							content={
								<>
									<KeyboardShortcuts />
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
									{ selectedArea === null && (
										<Inserter>
											<BlockEditorInserter
												toggleProps={
													disabledInserterToggleProps
												}
											/>
										</Inserter>
									) }
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
