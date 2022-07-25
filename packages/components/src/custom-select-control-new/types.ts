/**
 * External dependencies
 */
import type { ReactNode } from 'react';

type SelectControlOptionBase = {
	value: string;
	label?: string;
	disabled?: boolean;
};

// options[] data object
export type SelectControlOption = SelectControlOptionBase & {
	id?: string;
};

// React component props
export type SelectControlItemProps = SelectControlOptionBase & {
	// Is classname necessary, with WordPressComponentProps?
	className?: string;
	children?: ReactNode;
	// Do we want to expose this prop?
	checked?: boolean;
};

export type SelectControlItemCheckProps = SelectControlOptionBase & {
	// Is classname necessary, with WordPressComponentProps?
	className?: string;
	children?: ReactNode;
};

export type SelectControlProps = {
	value?: string;
	label?: string;
	// TODO: explain that they are ignored if `children` is specified
	options?: SelectControlOption[];
	children?: ReactNode;
	// Is classname necessary, with WordPressComponentProps?
	className?: string;
};

export type SelectControlArrowProps = {
	// Is classname necessary, with WordPressComponentProps?
	className?: string;
};

export type SelectControlGroupProps = {
	children: ReactNode;
	// Is classname necessary, with WordPressComponentProps?
	className?: string;
};

export type SelectControlGroupLabelProps = {
	children: ReactNode;
	// Is classname necessary, with WordPressComponentProps?
	className?: string;
};

export type SelectControlSeparatorProps = {
	// Is classname necessary, with WordPressComponentProps?
	className?: string;
};

export type SelectControlRowProps = {
	children: ReactNode;
	// Is classname necessary, with WordPressComponentProps?
	className?: string;
};
