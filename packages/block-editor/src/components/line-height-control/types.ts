import type { ComponentProps } from 'react';
import type { __experimentalNumberControl as NumberControl } from '@wordpress/components';

type NumberControlProps = ComponentProps< typeof NumberControl >;

/**
 * The state reducer `NumberControl` runs on each change.
 */
export type LineHeightStateReducer = NonNullable<
	NumberControlProps[ '__unstableStateReducer' ]
>;

/**
 * The change handler `NumberControl` calls.
 */
export type LineHeightControlOnChange = NonNullable<
	NumberControlProps[ 'onChange' ]
>;

/**
 * Props of `LineHeightControl`. The control sets its label, range and spin
 * behavior itself.
 */
export interface LineHeightControlProps extends Omit<
	NumberControlProps,
	| 'value'
	| 'onChange'
	| 'label'
	| 'min'
	| 'step'
	| 'spinFactor'
	| 'spinControls'
	| '__unstableStateReducer'
> {
	/**
	 * Start opting into the larger default height that will become the
	 * default size in a future version.
	 *
	 * @deprecated Default behavior since WordPress 7.1. Prop can be safely removed.
	 */
	__next40pxDefaultSize?: boolean;
	/**
	 * The line height, unset when `undefined`.
	 */
	value?: string | number;
	/**
	 * Called with the next line height, or nothing when it is cleared.
	 */
	onChange: ( value?: string | number ) => void;
	/**
	 * The width of the input.
	 */
	__unstableInputWidth?: NumberControlProps[ '__unstableInputWidth' ];
}
