import { createSlotFill } from '@wordpress/components';

/**
 * Where an admin screen puts its actions in the site shell, beside its title
 * in the bar. Screens render the fill, from the boot package's private APIs,
 * so it reaches the shell's slot whichever copy of the components package
 * the screen was built with.
 */
export const { Fill: ShellPageActions, Slot: ShellPageActionsSlot } =
	createSlotFill( 'SiteShellPageActions' );
