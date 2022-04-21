/**
 * External dependencies
 */
import type {
	CSSProperties,
	ReactNode,
	ChangeEvent,
	SyntheticEvent,
	PointerEvent,
	HTMLInputTypeAttribute,
} from 'react';
import type { useDrag } from '@use-gesture/react';

/**
 * Internal dependencies
 */
import type { StateReducer } from './reducer/state';
import type { WordPressComponentProps } from '../ui/context';
import type { FlexProps } from '../flex/types';

export type LabelPosition = 'top' | 'bottom' | 'side' | 'edge';

export type DragDirection = 'n' | 's' | 'e' | 'w';

export type DragProps = Parameters< Parameters< typeof useDrag >[ 0 ] >[ 0 ];

export type Size = 'default' | 'small' | '__unstable-large';

interface BaseProps {
	__unstableInputWidth?: CSSProperties[ 'width' ];
	/**
	 * If true, the label will only be visible to screen readers.
	 *
	 * @default false
	 */
	hideLabelFromVision?: boolean;
	/**
	 * Whether the component should be in a focused state.
	 * Used to coordinate focus states when the actual focused element and the component handling
	 * visual focus are separate.
	 *
	 * @default false
	 */
	isFocused: boolean;
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

export type InputChangeCallback<
	E = ChangeEvent< HTMLInputElement > | PointerEvent< HTMLInputElement >,
	P = {}
> = ( nextValue: string | undefined, extra: { event: E } & P ) => void;

export interface InputFieldProps extends BaseProps {
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
	setIsFocused: ( isFocused: boolean ) => void;
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
	 */
	prefix?: ReactNode;
	/**
	 * Renders an element on the right side of the input.
	 */
	suffix?: ReactNode;
	/**
	 * If true, the `input` will be disabled.
	 *
	 * @default false
	 */
	disabled?: boolean;
	className?: string;
	id?: string;
	/**
	 * If this property is added, a label will be generated using label property as the content.
	 */
	label?: ReactNode;
}

export interface InputControlProps
	extends Omit< InputBaseProps, 'children' | 'isFocused' | keyof FlexProps >,
		/**
		 * The `prefix` prop in `WordPressComponentProps< InputFieldProps, 'input', false >` comes from the
		 * `HTMLInputAttributes` and clashes with the one from `InputBaseProps`. So we have to omit it from
		 * `WordPressComponentProps< InputFieldProps, 'input', false >` in order that `InputBaseProps[ 'prefix' ]`
		 * be the only prefix prop. Otherwise it tries to do a union of the two prefix properties and you end up
		 * with an unresolvable type.
		 *
		 * `isFocused` and `setIsFocused` are managed internally by the InputControl, but the rest of the props
		 * for InputField are passed through.
		 */
		Omit<
			WordPressComponentProps< InputFieldProps, 'input', false >,
			'stateReducer' | 'prefix' | 'isFocused' | 'setIsFocused'
		> {
	__unstableStateReducer?: InputFieldProps[ 'stateReducer' ];
}

export interface InputControlLabelProps {
	children: ReactNode;
	hideLabelFromVision?: BaseProps[ 'hideLabelFromVision' ];
	labelPosition?: BaseProps[ 'labelPosition' ];
	size?: BaseProps[ 'size' ];
}
