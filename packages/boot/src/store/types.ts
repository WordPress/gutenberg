/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Icon type supporting multiple formats:
 * - Dashicon strings (e.g., "dashicons-admin-generic")
 * - JSX elements
 * - SVG icons from @wordpress/icons
 * - Data URLs for images
 */
export type IconType = string | JSX.Element | ReactNode;

export interface MenuItem {
	id: string;
	label: string;
	to: string;
	icon?: IconType;
	parent?: string;
	parent_type?: 'drilldown' | 'dropdown';
}

export interface State {
	menuItems: Record< string, MenuItem >;
}
