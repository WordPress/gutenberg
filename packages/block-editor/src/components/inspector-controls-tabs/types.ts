import type { ReactElement } from 'react';

/**
 * A tab of the block inspector.
 */
export interface InspectorTab {
	name: string;
	title: string;
	value: string;
	icon: ReactElement;
}

export interface InspectorControlsTabsProps {
	blockName?: string;
	clientId?: string;
	hasBlockStyles?: boolean;
	tabs: InspectorTab[];
	isSectionBlock?: boolean;
	contentClientIds?: string[];
}

export interface ContentTabProps {
	contentClientIds?: string[];
	onSwitchToListView?: ( clientId: string ) => void;
	hasListViewTab?: boolean;
}

export interface SettingsTabProps {
	showAdvancedControls?: boolean;
}

export interface AdvancedControlsProps {
	initialOpen?: boolean;
}

export interface SectionStyleControlsProps {
	blockName: string;
	clientId: string;
	contentClientIds: string[];
}

export interface StylesTabProps extends Partial< SectionStyleControlsProps > {
	hasBlockStyles?: boolean;
	isSectionBlock?: boolean;
}

/**
 * The position style of a block.
 */
export interface PositionStyle {
	type?: string;
	top?: string;
	right?: string;
	bottom?: string;
	left?: string;
}

/**
 * A block style that holds a position, at the root or in a viewport state
 * keyed by `@` and the viewport.
 */
export type PositionStyleAttribute = Record< string, unknown > & {
	position?: PositionStyle;
};
