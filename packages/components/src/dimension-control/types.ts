/**
 * Internal dependencies
 */
import type { IconType } from '../icon';

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

export type DimensionControlProps = {
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
	/**
	 * Start opting into the larger default height that will become the default size in a future version.
	 *
	 * @default false
	 */
	__next40pxDefaultSize?: boolean;
};
