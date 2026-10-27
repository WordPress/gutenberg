/**
 * A WordPress admin menu command.
 */
export interface AdminMenuCommand {
	/** Command name. */
	name: string;
	/** Menu label. */
	label: string;
	/** Destination URL. */
	url: string;
}

/**
 * Command palette settings.
 */
export interface CommandPaletteSettings {
	/** Commands for the current admin menu. */
	menu_commands?: AdminMenuCommand[] | null;
	/** Whether the palette is displayed in the network admin. */
	is_network_admin?: boolean;
}
