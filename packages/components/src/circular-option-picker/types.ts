/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type CircularOptionPickerProps = {
	/**
	 * A CSS class to apply to the wrapper element.
	 */
	className?: string;
	/**
	 * The action(s) to be rendered after the options,
	 * such as a 'clear' button as seen in `ColorPalette`.
	 * Usually a `CircularOptionPicker.ButtonAction` or
	 * `CircularOptionPicker.DropdownLinkAction` component.
	 */
	actions?: ReactNode;
	/**
	 * The options to be rendered, such as color swatches.
	 * Usually a `CircularOptionPicker.Option` component.
	 */
	options: ReactNode;
	/**
	 * The child elements.
	 */
	children?: ReactNode;
};
