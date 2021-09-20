/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactNode } from 'react';

type ResetAll = ( filters?: any[] ) => void;
type PanelId = string;
type ResetAllFilter = () => void;
type Label = string;

export interface ToolsPanelProps {
	panelId: PanelId;
	label: Label;
	header: string;
	children: ReactNode;
	resetAll: ResetAll;
	className?: string;
}

export interface ToolsPanelHeaderProps {
	label: Label;
	resetAll: ResetAll;
	toggleItem: ( label: string ) => void;
}

export interface ToolsPanelItem {
	hasValue: () => boolean;
	isShownByDefault: boolean;
	label: Label;
	resetAllFilter: ResetAllFilter;
	panelId: PanelId;
}

export interface ToolsPanelItemProps extends ToolsPanelItem {
	panelId: PanelId;
	children?: ReactNode;
	onDeselect?: () => void;
	onSelect?: () => void;
	className?: string;
	resetAllFilter: ResetAllFilter;
}

export type ToolsPanelMenuItemKey = 'default' | 'optional';

export type ToolsPanelMenuItems = {
	[ menuItemKey in ToolsPanelMenuItemKey ]: { [ key: string ]: boolean };
};

export interface TPContext {
	panelId?: PanelId;
	menuItems?: ToolsPanelMenuItems;
	hasMenuItems?: number;
	registerPanelItem?: ( item: ToolsPanelItem ) => void;
	deregisterPanelItem?: ( label: Label ) => void;
	flagItemCustomization?: ( label: Label ) => void;
	isResetting?: boolean;
}

export interface ToolsPanelControlsGroupProps {
	items: [ string, boolean ][];
	onClose: () => void;
	toggleItem: ( label: Label ) => void;
}

export interface ToolsPanelMenuItemsConfig {
	panelItems: ToolsPanelItem[];
	reset: boolean;
}
