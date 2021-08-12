/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactNode, Ref } from 'react';

export type forwardRef = Ref< any >;

export interface ToolsPanelProps {
	label: string;
	header: string;
	children: ReactNode;
	resetAll: () => void;
	className?: string;
}

export interface ToolsPanelHeaderProps {
	menuLabel: string;
	header: string;
	resetAll: () => void;
	toggleItem: ( label: string ) => void;
	className?: string;
}

export interface ToolsPanelItem {
	hasValue: () => boolean;
	isShownByDefault: boolean;
	label: string;
}

export interface ToolsPanelItemProps extends ToolsPanelItem {
	children?: ReactNode;
	onDeselect?: () => void;
	onSelect?: () => void;
	className?: string;
}

export interface TPContext {
	menuItems?: { [ key: string ]: boolean };
	registerPanelItem?: ( item: ToolsPanelItem ) => void;
}
