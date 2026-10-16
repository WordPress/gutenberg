import type { ComponentProps } from 'react';
import type { CustomSelectControl } from '@wordpress/components';
import type { FontFamilyPreset } from '@wordpress/global-styles-engine';

type CustomSelectControlProps = ComponentProps< typeof CustomSelectControl >;

/**
 * A font family the control offers, labelled by its name or its CSS value.
 */
export type FontFamilyOption = Pick< FontFamilyPreset, 'fontFamily' > &
	Partial< FontFamilyPreset >;

/**
 * Props of `FontFamilyControl`.
 */
export interface FontFamilyControlProps extends Partial<
	Omit< CustomSelectControlProps, 'value' | 'onChange' | 'options' >
> {
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
}
