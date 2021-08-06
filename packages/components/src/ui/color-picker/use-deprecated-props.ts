/**
 * External dependencies
 */
import colorize, { ColorFormats } from 'tinycolor2';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ColorPickerProps } from './component';

/**
 * @deprecated
 */
type LegacyColor =
	| string
	| {
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
			draftHex: string;
			draftHsl: ColorFormats.HSL | ColorFormats.HSLA;
			draftRgb: ColorFormats.RGB | ColorFormats.RGBA;
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
	return typeof props.onChangeComplete !== 'undefined';
}

function getColorFromLegacyProps( props: LegacyProps ): string {
	if ( typeof props.color === 'string' ) {
		return props.color;
	}

	return props.color.hex;
}

function toHsl(
	color: colorize.Instance
): ColorFormats.HSL | ColorFormats.HSLA {
	const { h, s, l, a } = color.toHsl();

	return {
		h: Math.round( h ),
		s: Math.round( s * 100 ),
		l: Math.round( l * 100 ),
		a,
	};
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

const transformHexToLegacyColor = memoize(
	( hex8: string ): LegacyColor => {
		const color = colorize( hex8 );
		const rawHex = color.toHex();
		const rgb = color.toRgb();
		const hsv = toHsv( color );
		const hsl = toHsl( color );

		const isTransparent = rawHex === '000000' && rgb.a === 0;

		const hex = isTransparent ? 'transparent' : `#${ rawHex }`;

		return {
			hex,
			rgb,
			hsv,
			hsl,
			draftHex: hex.toLowerCase(),
			draftHsl: hsl,
			draftRgb: rgb,
			source: 'hex',
			oldHue: hsl.h,
		};
	}
);

export function useDeprecatedProps(
	props: LegacyProps | ColorPickerProps
): ColorPickerProps {
	const onChange = useCallback(
		( hex8: string ) => {
			if ( isLegacyProps( props ) ) {
				return props.onChangeComplete(
					transformHexToLegacyColor( hex8 )
				);
			}

			return props.onChange?.( hex8 );
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
		onChange,
		color,
		enableAlpha,
		defaultValue: ( props as ColorPickerProps ).defaultValue,
		copyFormat: ( props as ColorPickerProps ).copyFormat,
		className: props.className,
	};
}
