/**
 * Internal dependencies
 */
import type { HeadingSize } from '../heading/types';

type Gradient = any; //TODO narrow this type

export type GradientPickerProps = {
	/**
	 * The class name added to the wrapper.
	 */
	className?: string;
	/**
	 * The current value of the gradient. Pass a css gradient string (See default value for example).
	 * Optionally pass in a `null` value to specify no gradient is currently selected.
	 *
	 * @default 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)'
	 */
	value?: string; //TODO: can this be typed more narrowly?
	/**
	 * The function called when a new gradient has been defined. It is passed to
	 * the `currentGradient` as an arugment.
	 */
	onChange: ( currentGradient: string | undefined ) => void;
	/**
	 * An array of object os predefined gradients which show up as
	 * `CircularOptionPicker` above the gradient selector.
	 */
	gradients?: Gradient[];
	/**
	 * Whether the palette should have a clearing button or not.
	 *
	 * @default true
	 */
	clearable?: boolean;
	/**
	 * Called when a new gradient has been defined. It is passed the
	 * `currentGradient` as an argument.
	 */
	clearGradient?: ( currentGradient: string ) => void;
	/**
	 * If true, the gradient pickerwill not be displayed and only defined
	 * gradients from `gradients` will be shown.
	 *
	 * @default false
	 */
	disableCustomGradients?: boolean;
	/**
	 * Start opting in to the new margin-free styles that will become the default
	 * in a future version, currently scheduled to be WordPress 6.4. (The prop
	 * can be safely removed once this happens.)
	 *
	 * @default false
	 */
	__nextHasNoMargin?: boolean;
	/**
	 * The heading level.
	 *
	 * @default 2
	 */
	headingLevel?: HeadingSize;
	/**
	 * Whether this is rendered in the sidebar.
	 *
	 * @default false
	 */
	__experimentalIsRenderedInSidebar?: boolean;
};
