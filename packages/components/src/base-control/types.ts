/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type BaseControlProps = {
	/**
	 * Start opting into the new margin-free styles that will become the default in a future version.
	 *
	 * @default false
	 */
	__nextHasNoMarginBottom?: boolean;
	/**
	 * Temporary private prop for showing better deprecation messages,
	 * e.g. `Some feature from wp.components.${ __associatedWPControl } is deprecated`.
	 *
	 * @ignore
	 */
	__associatedWPComponentName?: string;
	/**
	 * The HTML `id` of the control element (passed in as a child to `BaseControl`) to which labels and help text are being generated.
	 * This is necessary to accessibly associate the label with that element.
	 *
	 * The recommended way is to use the `useBaseControlProps` hook, which takes care of generating a unique `id` for you.
	 * Otherwise, if you choose to pass an explicit `id` to this prop, you are responsible for ensuring the uniqueness of the `id`.
	 */
	id?: string;
	/**
	 * Additional description for the control.
	 *
	 * Only use for meaningful description or instructions for the control. An element containing the description will be programmatically associated to the BaseControl by the means of an `aria-describedby` attribute.
	 */
	help?: ReactNode;
	/**
	 * If this property is added, a label will be generated using label property as the content.
	 */
	label?: ReactNode;
	/**
	 * If true, the label will only be visible to screen readers.
	 *
	 * @default false
	 */
	hideLabelFromVision?: boolean;
	className?: string;
	/**
	 * The content to be displayed within the `BaseControl`.
	 */
	children: ReactNode;
};

export type BaseControlVisualLabelProps = {
	/**
	 * The content to be displayed within the `BaseControl.VisualLabel`.
	 */
	children: ReactNode;
};
