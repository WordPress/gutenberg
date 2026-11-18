import type {
	CSSProperties,
	FocusEventHandler,
	MouseEventHandler,
} from 'react';
import type { FontFamilyPreset } from '@wordpress/global-styles-engine';

/**
 * A font family the control offers, labelled by its name or its CSS value.
 */
export type FontFamilyOption = Pick< FontFamilyPreset, 'fontFamily' > &
	Partial< FontFamilyPreset >;

/**
 * A custom font option, with optional preview styling and hint text.
 */
export interface FontFamilyCustomOption {
	key: string;
	name: string;
	style?: CSSProperties;
	className?: string;
	hint?: string;
	/**
	 * @deprecated Use `hint` instead.
	 */
	__experimentalHint?: string;
	[ key: string ]: unknown;
}

/**
 * Props of `FontFamilyControl`.
 */
export interface FontFamilyControlProps {
	/**
	 * Start opting into the larger default height that will become the
	 * default size in a future version.
	 *
	 * @deprecated Default behavior since WordPress 7.1. Prop can be safely removed.
	 */
	__next40pxDefaultSize?: boolean;
	/**
	 * The selected font family.
	 */
	value?: string;
	/**
	 * Called with the selected font family, or `''` for the default.
	 */
	onChange: ( value: string ) => void;
	/**
	 * The font families to choose from, in place of the block's settings.
	 */
	fontFamilies?: FontFamilyOption[];
	className?: string;
	label?: string;
	hideLabelFromVision?: boolean;
	describedBy?: string;
	size?: 'default' | 'small';
	disabled?: boolean;
	onBlur?: FocusEventHandler< HTMLButtonElement >;
	onFocus?: FocusEventHandler< HTMLButtonElement >;
	onMouseOut?: MouseEventHandler< HTMLButtonElement >;
	onMouseOver?: MouseEventHandler< HTMLButtonElement >;
	/**
	 * Custom options, in place of the font family presets.
	 */
	options?: ReadonlyArray< FontFamilyCustomOption >;
	/**
	 * Show the selected option's hint in the trigger.
	 */
	showSelectedHint?: boolean;
	/**
	 * @deprecated Use `showSelectedHint` instead.
	 */
	__experimentalShowSelectedHint?: boolean;
	/**
	 * @deprecated The unconstrained width is the default. The prop can be safely removed.
	 */
	__nextUnconstrainedWidth?: boolean;
	/**
	 * @deprecated The prop is no longer needed and is ignored.
	 */
	__nextHasNoMarginBottom?: boolean;
}
