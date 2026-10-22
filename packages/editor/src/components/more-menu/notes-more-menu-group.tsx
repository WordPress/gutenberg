import { createSlotFill } from '@wordpress/components';

/**
 * Slot in the View group of the editor's Options menu, before Panels, that the
 * Notes feature fills with its submenu.
 */
const NotesMoreMenuGroup = createSlotFill( Symbol( 'NotesMoreMenuGroup' ) );

export default NotesMoreMenuGroup;
