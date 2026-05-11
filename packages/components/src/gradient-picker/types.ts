/**
 * Internal dependencies
 */
import type { HeadingSize } from '../heading/types';

export type GradientObject = {
	gradient: string;
	name: string;
	slug: string;
};
export type OriginObject = { name: string; gradients: GradientObject[] };
export type GradientsProp = GradientObject[] | OriginObject[];

type GradientPickerBaseProps = {
	/**
	 * The class name added to the wrapper.
	 */
	className?: string;
	/**
	 * The function called when a new gradient has been defined. It is passed to
	 * the `currentGradient` as an argument.
	 */
	onChange: ( currentGradient: string | undefined ) => void;
	/**
	 * The current value of the gradient. Pass a css gradient string (See default value for example).
	 * Optionally pass in a `null` value to specify no gradient is currently selected.
	 *
	 * @default 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)'
	 */
	value?: GradientObject[ 'gradient' ] | null;
	/**
	 * Whether the palette should have a clearing button or not.
	 *
	 * @default true
	 */
	clearable?: boolean;
	/**
	 * The heading level. Only applies in cases where gradients are provided
	 * from multiple origins (i.e. when the array passed as the `gradients` prop
	 * contains two or more items).
	 *
	 * @default 2
	 */
	headingLevel?: HeadingSize;
	/**
	 * Whether the control should present as a set of buttons,
	 * each with its own tab stop.
	 *
	 * @default false
	 */
	asButtons?: boolean;
	/**
	 * Prevents keyboard interaction from wrapping around.
	 * Only used when `asButtons` is not true.
	 *
	 * @default true
	 */
	loop?: boolean;
	/**
	 * Whether to enable alpha transparency options in the picker.
	 *
	 * @default true
	 */
	enableAlpha?: boolean;
} & (
	| {
			// TODO: [#54055] Either this or `aria-labelledby` should be required
			/**
			 * A label to identify the purpose of the control.
			 */
			'aria-label'?: string;
			'aria-labelledby'?: never;
	  }
	| {
			// TODO: [#54055] Either this or `aria-label` should be required
			/**
			 * An ID of an element to provide a label for the control.
			 */
			'aria-labelledby'?: string;
			'aria-label'?: never;
	  }
);

export type GradientPickerComponentProps = GradientPickerBaseProps & {
	/**
	 * An array of objects as predefined gradients displayed above the gradient
	 * selector. Alternatively, if there are multiple sets (or 'origins') of
	 * gradients, you can pass an array of objects each with a `name` and a
	 * `gradients` array which will in turn contain the predefined gradient objects.
	 *
	 * @default []
	 */
	gradients?: GradientsProp;
	/**
	 * Start opting in to the new margin-free styles that will become the default
	 * in a future version, currently scheduled to be WordPress 6.4. (The prop
	 * can be safely removed once this happens.)
	 *
	 * @default false
	 * @deprecated Default behavior since WP 6.5. Prop can be safely removed.
	 * @ignore
	 */
	__nextHasNoMargin?: boolean;
	/**
	 * If true, the gradient picker will not be displayed and only defined
	 * gradients from `gradients` will be shown.
	 *
	 * @default false
	 */
	disableCustomGradients?: boolean;
	/**
	 * Whether this is rendered in the sidebar.
	 *
	 * @default false
	 */
	__experimentalIsRenderedInSidebar?: boolean;
};

export type PickerProps< TOriginType extends GradientObject | OriginObject > =
	GradientPickerBaseProps & {
		clearGradient: () => void;
		onChange: (
			currentGradient: string | undefined,
			index: number
		) => void;
		actions?: React.ReactNode;
		gradients: TOriginType[];
	};
