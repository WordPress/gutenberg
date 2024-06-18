/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'SidebarNavigationScreenMainPlugins' );

const SidebarNavigationScreenMainPlugins = ( { children } ) => {
	return <Fill>{ children }</Fill>;
};

SidebarNavigationScreenMainPlugins.Slot = Slot;

export default SidebarNavigationScreenMainPlugins;
