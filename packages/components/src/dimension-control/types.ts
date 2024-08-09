/**
 * Internal dependencies
 */
import type { IconType } from '../icon';
import type { SelectControlProps } from '../select-control/types';

export type Size = {
	/**
	 * Human-readable name of the size.
	 */
	name: string;
	/**
	 * Short unique identifying name of the size.
	 */
	slug: string;
};

export type DimensionControlProps = Pick<
	SelectControlProps,
	'__next40pxDefaultSize' | '__nextHasNoMarginBottom'
> & {
	/**
	 * Label for the control.
	 */
	label: string;
	/**
	 * An array of sizes to choose from.
	 *
	 * @default DEFAULT_SIZES
	 *
	 * @see packages/components/src/dimension-control/sizes.ts
	 */
	sizes?: Size[];
	/**
	 * Optional icon rendered in front on the label.
	 */
	icon?: IconType;
	/**
	 * Used to externally control the current value of the control.
	 */
	value?: string;
	/**
	 * Function called with the control's internal state changes. The `value` property is equal to a given size slug.
	 */
	onChange?: ( value?: string ) => void;
	/**
	 * CSS class applied to `SelectControl`.
	 *
	 * @default ''
	 */
	className?: string;
};
