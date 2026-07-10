/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: NotesMoreMenuGroup, Slot } = createSlotFill(
	Symbol( 'NotesMoreMenuGroup' )
);

NotesMoreMenuGroup.Slot = ( { fillProps } ) => <Slot fillProps={ fillProps } />;

export default NotesMoreMenuGroup;
