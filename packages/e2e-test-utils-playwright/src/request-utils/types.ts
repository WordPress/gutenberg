/**
 * Widget REST response fields used by the widget utilities.
 */
export interface Widget {
	id: string;
}

/**
 * Sidebar REST response fields used by the widget utilities.
 */
export interface Sidebar {
	id: string;
	widgets: string[];
}
