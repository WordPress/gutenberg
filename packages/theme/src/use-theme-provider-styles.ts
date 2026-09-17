import type { CSSProperties } from 'react';
import { useMemo, useContext } from '@wordpress/element';
import { ThemeContext } from './context.ts';
import { DEFAULT_SEED_COLORS } from './color-ramps/index.ts';
import { generateColorTokens } from './generate-color-tokens.ts';
import type { ThemeProviderColorWarning } from './theme-provider-color-warnings.ts';
import type { ThemeProviderProps } from './types.ts';

export function useThemeProviderStyles( {
	color = {},
	cursor,
	cornerRadius,
}: {
	color?: ThemeProviderProps[ 'color' ];
	cursor?: ThemeProviderProps[ 'cursor' ];
	cornerRadius?: ThemeProviderProps[ 'cornerRadius' ];
} = {} ) {
	const { resolvedSettings: inheritedSettings } = useContext( ThemeContext );

	// Color styles are only emitted when seeds are either applied locally or
	// inherited from an ancestor. Otherwise, the expectation is that static CSS
	// stylesheet, build fallbacks, or CSS properties defined elsewhere apply
	// (e.g. `@wordpress/base-styles`). Inherited seed values must always be
	// reapplied so portaled subtrees retain the values.
	const hasColor =
		color.primary !== undefined ||
		color.background !== undefined ||
		inheritedSettings.color?.primary !== undefined ||
		inheritedSettings.color?.background !== undefined;

	// Compute settings:
	// - used provided prop value;
	// - otherwise, if a parent instance exists, use its inherited value or default;
	// - otherwise, omit.
	const primary = hasColor
		? ( color.primary ??
			inheritedSettings.color?.primary ??
			DEFAULT_SEED_COLORS.primary )
		: undefined;
	const background = hasColor
		? ( color.background ??
			inheritedSettings.color?.background ??
			DEFAULT_SEED_COLORS.background )
		: undefined;
	const cursorControl = cursor?.control ?? inheritedSettings.cursor?.control;
	const cornerRadiusPreset =
		cornerRadius ?? inheritedSettings.cornerRadius ?? 'subtle';

	const resolvedSettings = useMemo(
		() => ( {
			color: {
				primary,
				background,
			},
			cursor: cursorControl ? { control: cursorControl } : undefined,
			cornerRadius: cornerRadiusPreset,
		} ),
		[ primary, background, cursorControl, cornerRadiusPreset ]
	);

	// The provider applies both groups: its subtree contains design system
	// components and older styles that still read the compatibility properties.
	const generatedColors = useMemo< {
		styles: CSSProperties;
		warnings: ThemeProviderColorWarning[] | undefined;
	} >( () => {
		if ( primary === undefined || background === undefined ) {
			return {
				styles: {},
				warnings: undefined,
			};
		}

		const { tokens, compatibility, warnings } = generateColorTokens( {
			primary,
			background,
		} );

		return {
			styles: { ...tokens, ...compatibility },
			warnings,
		};
	}, [ primary, background ] );

	const themeProviderStyles: CSSProperties = useMemo(
		() => ( {
			...generatedColors.styles,
			...( cursorControl && {
				'--wpds-cursor-control': cursorControl,
			} ),
		} ),
		[ generatedColors.styles, cursorControl ]
	);

	return {
		resolvedSettings,
		themeProviderStyles,
		colorWarnings: generatedColors.warnings,
	};
}
