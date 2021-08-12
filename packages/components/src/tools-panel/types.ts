/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactNode, Ref } from 'react';

export type toolsPanelforwardRef = Ref< any >;

export interface ToolsPanelProps {
	label: string;
	header: string;
	children: ReactNode;
	resetAll: () => undefined;
	className?: string;
}

export interface ToolsPanelHeaderProps {
	menuLabel: string;
	header: string;
	resetAll: () => undefined;
	toggleItem: ( label: string ) => undefined;
	className?: string;
}

export interface ToolPanelItem {
	hasValue: () => boolean;
	isShownByDefault: boolean;
	label: string;
}

export interface TPContext {
	menuItems?: { [ key: string ]: boolean };
}
