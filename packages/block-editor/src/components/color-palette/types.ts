import type { ColorGradientControlProps } from '../colors-gradients/types';

/**
 * Props of `ColorPaletteControl`, which offers no gradients.
 */
export interface ColorPaletteControlProps extends Omit<
	ColorGradientControlProps,
	'onColorChange' | 'colorValue' | 'gradients' | 'disableCustomGradients'
> {
	/**
	 * Called with the selected color.
	 */
	onChange?: ColorGradientControlProps[ 'onColorChange' ];
	/**
	 * The selected color.
	 */
	value?: string;
}

/**
 * Props `withColorContext` reads, with the ones of the wrapped component.
 */
export interface WithColorContextProps {
	colors?: ColorGradientControlProps[ 'colors' ];
	disableCustomColors?: boolean;
	[ prop: string ]: unknown;
}
