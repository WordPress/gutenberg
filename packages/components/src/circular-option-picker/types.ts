/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import type { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { ButtonAsButtonProps } from '../button/types';
import type { DropdownProps } from '../dropdown/types';
import type { WordPressComponentProps } from '../context';

type CommonCircularOptionPickerProps = {
	/**
	 * An ID to apply to the component.
	 */
	id?: string;
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
	/**
	 * The ID reference list of one or more elements that label the wrapper
	 * element.
	 */
	'aria-labelledby'?: string;
	/**
	 * The label for the wrapper element. Defaults to 'Custom color picker'. Not
	 * used if an 'aria-labelledby' is provided.
	 */
	'aria-label'?: string;
};

type WithBaseId = {
	baseId: string;
};

type FullListboxCircularOptionPickerProps = CommonCircularOptionPickerProps & {
	/**
	 * Whether the control should present as a set of buttons,
	 * each with its own tab stop.
	 */
	asButtons?: false;
	/**
	 * Prevents keyboard interaction from wrapping around.
	 * Only used when `asButtons` is not true.
	 *
	 * @default true
	 */
	loop?: boolean;
};

export type ListboxCircularOptionPickerProps = WithBaseId &
	Omit< FullListboxCircularOptionPickerProps, 'asButtons' >;

type FullButtonsCircularOptionPickerProps = CommonCircularOptionPickerProps & {
	/**
	 * Whether the control should present as a set of buttons,
	 * each with its own tab stop.
	 *
	 * @default false
	 */
	asButtons: true;
};

export type ButtonsCircularOptionPickerProps = WithBaseId &
	Omit< FullButtonsCircularOptionPickerProps, 'asButtons' >;

export type CircularOptionPickerProps =
	| FullListboxCircularOptionPickerProps
	| FullButtonsCircularOptionPickerProps;

export type DropdownLinkActionProps = {
	buttonProps?: Omit<
		WordPressComponentProps< ButtonAsButtonProps, 'button', false >,
		'children'
	>;
	linkText: string;
	dropdownProps: Omit< DropdownProps, 'className' | 'renderToggle' >;
	className?: string;
};

export type OptionGroupProps = {
	className?: string;
	options: ReactNode;
};

export type OptionProps = Omit<
	WordPressComponentProps< ButtonAsButtonProps, 'button', false >,
	'isPressed' | 'className'
> & {
	className?: string;
	tooltipText?: string;
	isSelected?: boolean;
	// `icon` is explicitly defined as 'check' by CircleOptionPicker.Option
	// and is not intended to be overridden.
	// `size` relies on the `Icon` component's default size of `24` to fit
	// `CircularOptionPicker`'s design, and should not be explicitly set.
	selectedIconProps?: Omit<
		React.ComponentProps< typeof Icon >,
		'icon' | 'size'
	>;
};

export type CircularOptionPickerContextProps = {
	baseId?: string;
	activeId?: string | null | undefined;
	setActiveId?: ( newId: string | null | undefined ) => void;
};
