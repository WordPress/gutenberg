import type { ReactNode } from 'react';

export type InterfaceSkeletonLabels = {
	/**
	 * Accessibility text for the top bar landmark region.
	 */
	header?: string;
	/**
	 * Accessibility text for the content landmark region.
	 */
	body?: string;
	/**
	 * Accessibility text for the secondary sidebar landmark region.
	 */
	secondarySidebar?: string;
	/**
	 * Accessibility text for the settings landmark region.
	 */
	sidebar?: string;
	/**
	 * Accessibility text for the publish landmark region.
	 */
	actions?: string;
	/**
	 * Accessibility text for the footer landmark region.
	 */
	footer?: string;
};

export type InterfaceSkeletonProps = {
	/**
	 * Whether the header is hidden until hovered, as in distraction free mode.
	 */
	isDistractionFree?: boolean;
	footer?: ReactNode;
	header?: ReactNode;
	/**
	 * Notices rendered in place of the header in distraction free mode.
	 */
	editorNotices?: ReactNode;
	sidebar?: ReactNode;
	secondarySidebar?: ReactNode;
	content?: ReactNode;
	actions?: ReactNode;
	/**
	 * Overrides for the accessibility labels of the landmark regions.
	 */
	labels?: InterfaceSkeletonLabels;
	className?: string;
};
