/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

export type SliderColors = {
	/**
	 * CSS color string to customize the Slider's error state.
	 *
	 * @default CONFIG.controlDestructiveBorderColor
	 */
	errorColor?: CSSProperties[ 'color' ];
	/**
	 * Allows customization of the thumb's color.
	 *
	 * @default COLORS.admin.theme
	 */
	thumbColor?: CSSProperties[ 'color' ];
	/**
	 * CSS color string to customize the track elements foreground color. This
	 * is the portion of the Slider's track representing progress or the actual
	 * value selected.
	 *
	 * @default COLORS.admin.theme
	 */
	trackColor?: CSSProperties[ 'color' ];
	/**
	 * CSS color string to customize the background for the track element.
	 *
	 * @default CONFIG.controlBackgroundDimColor
	 */
	trackBackgroundColor?: CSSProperties[ 'color' ];
};

export type SliderProps = SliderColors & {
	/**
	 * Default value for input.
	 */
	defaultValue?: string;
	/**
	 * Renders an error state.
	 *
	 * @default false
	 */
	error?: boolean;
	/**
	 * Renders focused styles.
	 *
	 * @default false
	 */
	isFocused?: boolean;
	/**
	 * Callback function when the `value` is committed.
	 */
	onChange?: ( value: string ) => void;
	/**
	 * Toggles which sized height the slider is rendered at.
	 *
	 * @default 'default'
	 */
	size?: 'small' | 'default' | 'large';
	/**
	 * The Slider's current value.
	 */
	value?: string;
};
