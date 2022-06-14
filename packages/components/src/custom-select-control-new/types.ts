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
	className?: string;
	children?: ReactNode;
};

// react component props
export type SelectControlProps = {
	value?: string;
	label?: string;
	// TODO: explain that they are ignored if `children` is specified
	options?: SelectControlOption[];
	children?: ReactNode;
	className?: string;
};
