/**
 * External dependencies
 */
import colorize, { ColorFormats } from 'tinycolor2';
// eslint-disable-next-line no-restricted-imports
import type { ComponentProps } from 'react';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type ColorPicker from './component';

type ColorPickerProps = ComponentProps< typeof ColorPicker >;

/**
 * @deprecated
 */
type LegacyColor =
	| string
	| {
			color: colorize.Instance;
			hex: string;
			hsl: ColorFormats.HSL | ColorFormats.HSLA;
			hsv: ColorFormats.HSV | ColorFormats.HSVA;
			rgb: ColorFormats.RGB | ColorFormats.RGBA;
			/**
			 * @deprecated
			 */
			oldHue: number;
			/**
			 * @deprecated
			 */
			source: 'hex';
	  };

/**
 * @deprecated
 */
export interface LegacyProps {
	color: LegacyColor;
	/**
	 * @deprecated
	 */
	onChangeComplete: ( colors: LegacyColor ) => void;
	/**
	 * @deprecated
	 */
	oldHue: string;
	className: string;
	/**
	 * @deprecated
	 */
	disableAlpha: boolean;
}

function isLegacyProps( props: any ): props is LegacyProps {
	return (
		typeof props.onChangeComplete !== 'undefined' ||
		typeof props.color === 'string' ||
		typeof props.color?.hex === 'string'
	);
}

function getColorFromLegacyProps(
	props: LegacyProps
): ColorFormats.HSL | ColorFormats.HSLA {
	if ( typeof props.color === 'string' ) {
		return colorize( props.color ).toHsl();
	}

	return props.color.hsl;
}

function toHsv(
	color: colorize.Instance
): ColorFormats.HSV | ColorFormats.HSVA {
	const { h, s, v, a } = color.toHsv();

	return {
		h: Math.round( h ),
		s: Math.round( s * 100 ),
		v: Math.round( v * 100 ),
		a,
	};
}

const transformHslToLegacyColor = memoize(
	( hsla: ColorFormats.HSL | ColorFormats.HSLA ): LegacyColor => {
		const color = colorize( hsla );
		const rawHex = color.toHex();
		const rgb = color.toRgb();
		const hsv = toHsv( color );
		const hsl = hsla;

		const isTransparent = rawHex === '000000' && rgb.a === 0;

		const hex = isTransparent ? 'transparent' : `#${ rawHex }`;

		return {
			color,
			hex,
			rgb,
			hsv,
			hsl,
			source: 'hex',
			oldHue: hsl.h,
		};
	}
);

export function useDeprecatedProps(
	props: LegacyProps | ColorPickerProps
): ColorPickerProps {
	const onChange = useCallback(
		( hsla: ColorFormats.HSL | ColorFormats.HSLA ) => {
			if ( isLegacyProps( props ) ) {
				return props.onChangeComplete(
					transformHslToLegacyColor( hsla )
				);
			}

			return props.onChange?.( hsla );
		},
		[
			( props as LegacyProps ).onChangeComplete,
			( props as ColorPickerProps ).onChange,
		]
	);

	const color = useMemo( () => {
		return isLegacyProps( props )
			? getColorFromLegacyProps( props )
			: props.color;
	}, [ props.color ] );

	const enableAlpha = useMemo( () => {
		return isLegacyProps( props )
			? ! props.disableAlpha
			: props.enableAlpha;
	}, [
		( props as LegacyProps ).disableAlpha,
		( props as ColorPickerProps ).enableAlpha,
	] );

	return {
		...( isLegacyProps( props ) ? {} : props ),
		onChange,
		color,
		enableAlpha,
	};
}
