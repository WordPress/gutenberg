import { createSlotFill } from '@wordpress/components';

const { Fill: NotesMoreMenuGroup, Slot } = createSlotFill(
	Symbol( 'NotesMoreMenuGroup' )
);

/**
 * Slot in the Tools group of the editor's Options menu that the Notes
 * feature fills with its submenu.
 */
export default Object.assign( NotesMoreMenuGroup, {
	Slot: () => <Slot />,
} );
