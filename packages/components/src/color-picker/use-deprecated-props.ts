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
import { useCallback } from '@wordpress/element';

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

function getColorFromLegacyProps(
	color: LegacyProps[ 'color' ]
): string | undefined {
	if ( color === undefined ) return;

	if ( typeof color === 'string' ) return color;

	if ( color.hex ) return color.hex;

	return undefined;
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
	const isUsingLegacy = isLegacyProps( props );
	const { onChangeComplete } = props as LegacyProps;
	const { onChange: onChangeProp } = props as ColorPickerProps;
	const legacyChangeHandler = useCallback(
		( color: string ) => {
			onChangeComplete( transformColorStringToLegacyColor( color ) );
		},
		[ onChangeComplete ]
	);
	const onChange = isUsingLegacy ? legacyChangeHandler : onChangeProp;

	const { color: colorProp } = props;
	const color = isUsingLegacy
		? getColorFromLegacyProps( colorProp )
		: ( colorProp as ColorPickerProps[ 'color' ] );

	const { disableAlpha } = props as LegacyProps;
	const { enableAlpha: enableAlphaProp } = props as ColorPickerProps;
	const enableAlpha = isUsingLegacy ? ! disableAlpha : enableAlphaProp;

	return {
		...( isUsingLegacy ? {} : props ),
		onChange,
		color,
		enableAlpha,
	};
}
