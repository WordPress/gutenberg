/**
 * External dependencies
 */
import type gradientParser from 'gradient-parser';

export type CustomGradientPickerProps = {
	/**
	 * Start opting in to the new margin-free styles that will become the default
	 * in a future version, currently scheduled to be WordPress 6.4. (The prop
	 * can be safely removed once this happens.)
	 *
	 * @default false
	 */
	__nextHasNoMargin?: boolean;
	/**
	 * The current value of the gradient. Pass a css gradient string (See default value for example).
	 * Optionally pass in a `null` value to specify no gradient is currently selected.
	 *
	 * @default 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)'
	 */
	value?: string;
	/**
	 * The function called when a new gradient has been defined. It is passed to
	 * the `currentGradient` as an arugment.
	 */
	onChange: ( currentGradient: string | undefined ) => void;
	/**
	 * Whether this is rendered in the sidebar.
	 *
	 * @default false
	 */
	__experimentalIsRenderedInSidebar?: boolean;
};

export type GradientAnglePickerProps = {
	gradientAST:
		| gradientParser.LinearGradientNode
		| gradientParser.RepeatingLinearGradientNode;
	hasGradient: boolean;
	onChange: ( gradient: string ) => void;
};
