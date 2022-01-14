/**
 * External dependencies
 */
import {
	colord,
	HslColor,
	HslaColor,
	HsvColor,
	HsvaColor,
	RgbColor,
	RgbaColor,
} from 'colord';
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
			hex: string;
			hsl: HslColor | HslaColor;
			hsv: HsvColor | HsvaColor;
			rgb: RgbColor | RgbaColor;
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
	color?: LegacyColor;
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
		typeof props.disableAlpha !== 'undefined' ||
		typeof props.color?.hex === 'string'
	);
}

function getColorFromLegacyProps( props: LegacyProps ): string | undefined {
	if ( typeof props?.color === 'undefined' ) {
		return undefined;
	}
	if ( typeof props.color === 'string' ) {
		return props.color;
	}
	if ( props.color.hex ) {
		return props.color.hex;
	}
}

const transformColorStringToLegacyColor = memoize(
	( color: string ): LegacyColor => {
		const colordColor = colord( color );
		const hex = colordColor.toHex();
		const rgb = colordColor.toRgb();
		const hsv = colordColor.toHsv();
		const hsl = colordColor.toHsl();

		return {
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
		( color: string ) => {
			if ( isLegacyProps( props ) ) {
				return props.onChangeComplete(
					transformColorStringToLegacyColor( color )
				);
			}

			return props.onChange?.( color );
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
