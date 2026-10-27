import type { ReactNode, RefObject } from 'react';
import type { PanelStyle, StyleSettings } from '../global-styles/types';

/**
 * The media properties of a background image. A theme.json string has none.
 */
export interface BackgroundImageMedia {
	url?: string;
	id?: number;
	title?: string;
	source?: string;
}

/**
 * Coordinates of a focal point, between 0 and 1.
 */
export interface FocalPoint {
	x?: number;
	y?: number;
}

export interface InspectorImagePreviewItemProps {
	/** Element the preview renders as. */
	as?: 'span' | 'button';
	/** URL of the image. */
	imgUrl?: string;
	/** Props of the toggle button. */
	toggleProps?: Record< string, unknown > & { isOpen?: boolean };
	/** File name of the image. */
	filename?: string;
	/** Label of the image. */
	label: string;
	/** Called when the dropdown opens or closes. */
	onToggleCallback?: ( isOpen: boolean ) => void;
}

export interface BackgroundControlsPanelProps {
	label?: string;
	filename?: string;
	url?: string;
	children?: ReactNode;
	onToggle?: ( isOpen: boolean ) => void;
	hasImageValue: boolean;
	onReset?: () => void;
	hasLocalOverride?: boolean;
	containerRef: RefObject< HTMLDivElement | null >;
}

export interface BackgroundImageControlsProps {
	onChange: ( value: PanelStyle ) => void;
	style?: PanelStyle;
	inheritedValue?: PanelStyle;
	onRemoveImage?: () => void;
	onResetImage?: () => void;
	displayInPanel?: boolean;
	defaultValues?: Record< string, unknown >;
	containerRef: RefObject< HTMLDivElement | null >;
}

export interface BackgroundSizeControlsProps {
	onChange: ( value: PanelStyle ) => void;
	style?: PanelStyle;
	inheritedValue?: PanelStyle;
	defaultValues?: Record< string, unknown >;
}

export interface BackgroundImageControlProps {
	/** The styles the control edits. */
	value?: PanelStyle;
	/** Called with the changed styles. */
	onChange: ( value: PanelStyle ) => void;
	/** The styles inherited from global styles. */
	inheritedValue?: PanelStyle;
	/** The settings of the block or element. */
	settings?: StyleSettings;
	/** The values the controls default to. */
	defaultValues?: Record< string, unknown >;
	/** Whether the control shows where its value is inherited from. */
	showInheritanceLabelIndicators?: boolean;
}
