/**
 * External dependencies
 */
import type {
	CSSProperties,
	ReactNode,
	SyntheticEvent,
	HTMLInputTypeAttribute,
} from 'react';
import type { useDrag } from '@use-gesture/react';

/**
 * Internal dependencies
 */
import type { StateReducer } from './reducer/state';
import type { WordPressComponentProps } from '../context';
import type { FlexProps } from '../flex/types';
import type { BaseControlProps } from '../base-control/types';

export type LabelPosition = 'top' | 'bottom' | 'side' | 'edge';

export type DragDirection = 'n' | 's' | 'e' | 'w';

export type DragProps = Parameters< Parameters< typeof useDrag >[ 0 ] >[ 0 ];

export type Size = 'default' | 'small' | 'compact' | '__unstable-large';

interface BaseProps {
	/**
	 * Deprecated. Use `__next40pxDefaultSize` instead.
	 *
	 * @default false
	 * @deprecated
	 */
	__next36pxDefaultSize?: boolean;
	/**
	 * Start opting into the larger default height that will become the default size in a future version.
	 *
	 * @default false
	 */
	__next40pxDefaultSize?: boolean;
	__unstableInputWidth?: CSSProperties[ 'width' ];
	/**
	 * If true, the label will only be visible to screen readers.
	 *
	 * @default false
	 */
	hideLabelFromVision?: boolean;
	/**
	 * The position of the label.
	 *
	 * @default 'top'
	 */
	labelPosition?: LabelPosition;
	/**
	 * Adjusts the size of the input.
	 *
	 * @default 'default'
	 */
	size?: Size;
}

export type InputChangeCallback< P = {} > = (
	nextValue: string | undefined,
	extra: { event: SyntheticEvent } & P
) => void;

export interface InputFieldProps
	extends Omit< BaseProps, '__next36pxDefaultSize' > {
	/**
	 * Determines the drag axis.
	 *
	 * @default 'n'
	 */
	dragDirection?: DragDirection;
	/**
	 * If `isDragEnabled` is true, this controls the amount of `px` to have been dragged before
	 * the drag gesture is actually triggered.
	 *
	 * @default 10
	 */
	dragThreshold?: number;
	/**
	 * If true, enables mouse drag gestures.
	 *
	 * @default false
	 */
	isDragEnabled?: boolean;
	/**
	 * If true, the `ENTER` key press is required in order to trigger an `onChange`.
	 * If enabled, a change is also triggered when tabbing away (`onBlur`).
	 *
	 * @default false
	 */
	isPressEnterToChange?: boolean;
	/**
	 * A function that receives the value of the input.
	 */
	onChange?: InputChangeCallback;
	onValidate?: (
		nextValue: string,
		event?: SyntheticEvent< HTMLInputElement >
	) => void;
	paddingInlineStart?: CSSProperties[ 'paddingInlineStart' ];
	paddingInlineEnd?: CSSProperties[ 'paddingInlineEnd' ];
	stateReducer?: StateReducer;
	/**
	 * The current value of the input.
	 */
	value?: string;
	onDragEnd?: ( dragProps: DragProps ) => void;
	onDragStart?: ( dragProps: DragProps ) => void;
	onDrag?: ( dragProps: DragProps ) => void;
	/**
	 * Type of the input element to render.
	 *
	 * @default 'text'
	 */
	type?: HTMLInputTypeAttribute;
}

export interface InputBaseProps extends BaseProps, FlexProps {
	children: ReactNode;
	/**
	 * Renders an element on the left side of the input.
	 *
	 * By default, the prefix is aligned with the edge of the input border, with no padding.
	 * If you want to apply standard padding in accordance with the size variant, wrap the element in
	 * the provided `<InputControlPrefixWrapper>` component.
	 *
	 * @example
	 * import {
	 *   __experimentalInputControl as InputControl,
	 *   __experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	 * } from '@wordpress/components';
	 *
	 * <InputControl
	 *   prefix={<InputControlPrefixWrapper>@</InputControlPrefixWrapper>}
	 * />
	 */
	prefix?: ReactNode;
	/**
	 * Renders an element on the right side of the input.
	 *
	 * By default, the suffix is aligned with the edge of the input border, with no padding.
	 * If you want to apply standard padding in accordance with the size variant, wrap the element in
	 * the provided `<InputControlSuffixWrapper>` component.
	 *
	 * @example
	 * import {
	 *   __experimentalInputControl as InputControl,
	 *   __experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
	 * } from '@wordpress/components';
	 *
	 * <InputControl
	 *   suffix={<InputControlSuffixWrapper>%</InputControlSuffixWrapper>}
	 * />
	 */
	suffix?: ReactNode;
	/**
	 * If true, the `input` will be disabled.
	 *
	 * @default false
	 */
	disabled?: boolean;
	/**
	 * If this property is added, a label will be generated using label property as the content.
	 */
	label?: ReactNode;
	/**
	 * Whether to hide the border when not focused.
	 *
	 * @default false
	 */
	isBorderless?: boolean;
}

export interface InputControlProps
	extends Omit<
			InputBaseProps,
			'children' | 'isBorderless' | keyof FlexProps
		>,
		Pick< BaseControlProps, 'help' >,
		/**
		 * The `prefix` prop in `WordPressComponentProps< InputFieldProps, 'input', false >` comes from the
		 * `HTMLInputAttributes` and clashes with the one from `InputBaseProps`. So we have to omit it from
		 * `WordPressComponentProps< InputFieldProps, 'input', false >` in order that `InputBaseProps[ 'prefix' ]`
		 * be the only prefix prop. Otherwise it tries to do a union of the two prefix properties and you end up
		 * with an unresolvable type.
		 *
		 * `paddingInlineStart`, and `paddingInlineEnd` are managed internally by
		 * the InputControl, but the rest of the props for InputField are passed through.
		 */
		Omit<
			WordPressComponentProps< InputFieldProps, 'input', false >,
			| 'stateReducer'
			| 'prefix'
			| 'paddingInlineStart'
			| 'paddingInlineEnd'
		> {
	__unstableStateReducer?: InputFieldProps[ 'stateReducer' ];
}

export interface InputControlLabelProps {
	children: ReactNode;
	hideLabelFromVision?: BaseProps[ 'hideLabelFromVision' ];
	labelPosition?: BaseProps[ 'labelPosition' ];
	size?: BaseProps[ 'size' ];
}

export type InputControlPrefixWrapperProps = {
	/**
	 * The prefix to be inserted.
	 */
	children: ReactNode;
};

export type InputControlSuffixWrapperProps = {
	/**
	 * The suffix to be inserted.
	 */
	children: ReactNode;
};
