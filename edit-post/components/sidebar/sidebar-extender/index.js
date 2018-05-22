/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'SidebarExtender' );

const SidebarExtender = Fill;
SidebarExtender.Slot = Slot;

export default SidebarExtender;
