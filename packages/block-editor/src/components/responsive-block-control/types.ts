import type { ReactNode } from 'react';

/**
 * A screen size the control can hold a value for.
 */
export interface ResponsiveBlockControlViewport {
	id: string;
	label: string;
}

export interface ResponsiveBlockControlProps {
	/** The title of the control group. */
	title: string;
	/** The CSS property the control group controls, such as `padding`. */
	property: string;
	/** Whether the control group shows a value for each screen size. */
	isResponsive?: boolean;
	/** Called when the toggle switches between the default and responsive values. */
	onIsResponsiveChange: ( isChecked: boolean ) => void;
	/** Renders the control of the default value, or of a given screen size. */
	renderDefaultControl: (
		labelComponent: ReactNode,
		viewport: ResponsiveBlockControlViewport
	) => ReactNode;
	/** Renders the controls of the responsive values. */
	renderResponsiveControls?: (
		viewports: ResponsiveBlockControlViewport[]
	) => ReactNode;
	/** Label of the toggle. */
	toggleLabel?: string;
	/** The screen size of the default value. */
	defaultLabel?: ResponsiveBlockControlViewport;
	/** The screen sizes of the responsive values. */
	viewports?: ResponsiveBlockControlViewport[];
}

export interface ResponsiveBlockControlLabelProps {
	/** The CSS property the control controls. */
	property: string;
	/** The screen size the control controls. */
	viewport: ResponsiveBlockControlViewport;
	/** Accessible description of the control. */
	desc?: string;
}
