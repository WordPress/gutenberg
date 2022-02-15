export interface MenuLocation {
	/**
	 * The name of the menu location.
	 */
	name: string;
	/**
	 * The description of the menu location.
	 */
	description: string;
	/**
	 * The ID of the assigned menu.
	 */
	menu: number;
}

export interface MenuLocationWithEdits extends MenuLocation {}
