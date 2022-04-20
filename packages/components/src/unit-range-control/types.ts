/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import { UnitControlProps } from '../unit-control/types';

export type LabelProps = {
	/**
	 * Provides control over whether the label will only be visible to
	 * screen readers.
	 */
	hideLabelFromVision?: boolean;
	/**
	 * If provided, a label will be generated using this as the content.
	 */
	label?: string;
};

// Once RangeControl has been converted to TypeScript, the following type
// could be imported from that component.

export type RangeMark = {
	value: number;
	label: string;
};

export type RangeControlProps = {
	label?: string;
	help?: string;
	beforeIcon?: string;
	afterIcon?: string;
	allowReset?: boolean;
	disabled?: boolean;
	initialPosition?: number;
	isShiftStepEnabled?: boolean;
	marks?: RangeMark[] | boolean;
	onChange: ( value?: number ) => void;
	min?: number;
	max?: number;
	railColor?: string;
	renderTooltipContent: ( value?: string ) => string;
	resetFallbackValue?: number;
	showTooltip?: boolean;
	step?: number | 'any';
	shiftStep?: number;
	trackColor?: string;
	value: number;
	icon?: string;
	separatorType?: 'none' | 'fullWidth' | 'topFullWidth';
	type?: string;
};

export type UnitRangeControlProps = LabelProps & {
	className?: string;
	value?: string;
	onChange: ( value?: string ) => void;
	unitControlProps?: UnitControlProps & { className?: string; step?: number };
	rangeControlProps?: RangeControlProps & { className?: string };
};
