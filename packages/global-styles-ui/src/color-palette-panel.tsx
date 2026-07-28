/**
 * WordPress dependencies
 */
import type {
	Color,
	ColorSchemeSettings,
} from '@wordpress/global-styles-engine';
import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalPaletteEdit as PaletteEdit,
	__experimentalVStack as VStack,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { shuffle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useSetting, useColorRandomizer } from './hooks';
import ColorVariations from './variations/variations-color';
import {
	normalizeColorSchemePresets,
	SchemePaletteIcon,
	type SchemePresetCollection,
} from './color-scheme-palette';

const mobilePopoverProps = { placement: 'bottom-start' as const, offset: 8 };

interface ColorPalettePanelProps {
	name?: string;
}

export default function ColorPalettePanel( { name }: ColorPalettePanelProps ) {
	const [ themeColors, setThemeColors ] = useSetting< Color[] >(
		'color.palette.theme',
		name
	);
	const [ baseThemeColors ] = useSetting< Color[] >(
		'color.palette.theme',
		name,
		'base'
	);
	const [ defaultColors, setDefaultColors ] = useSetting< Color[] >(
		'color.palette.default',
		name
	);
	const [ baseDefaultColors ] = useSetting< Color[] >(
		'color.palette.default',
		name,
		'base'
	);
	const [ customColors, setCustomColors ] = useSetting< Color[] >(
		'color.palette.custom',
		name
	);
	const [ lightScheme ] = useSetting< ColorSchemeSettings >(
		'color.light',
		name
	);
	const [ lightColors, setLightColors ] = useSetting<
		SchemePresetCollection< Color >
	>( 'color.light.palette', name );
	const [ userLightColors ] = useSetting< SchemePresetCollection< Color > >(
		'color.light.palette',
		name,
		'user'
	);
	const [ darkScheme ] = useSetting< ColorSchemeSettings >(
		'color.dark',
		name
	);
	const [ darkColors, setDarkColors ] = useSetting<
		SchemePresetCollection< Color >
	>( 'color.dark.palette', name );
	const [ userDarkColors ] = useSetting< SchemePresetCollection< Color > >(
		'color.dark.palette',
		name,
		'user'
	);

	const normalizedLightColors = normalizeColorSchemePresets(
		themeColors,
		lightColors
	);
	const normalizedDarkColors = normalizeColorSchemePresets(
		themeColors,
		darkColors
	);
	const hasLightColors =
		lightScheme !== undefined && normalizedLightColors.length > 0;
	const hasDarkColors =
		darkScheme !== undefined && normalizedDarkColors.length > 0;

	const [ defaultPaletteEnabled ] = useSetting< boolean >(
		'color.defaultPalette',
		name
	);

	const isMobileViewport = useViewportMatch( 'small', '<' );
	const popoverProps = isMobileViewport ? mobilePopoverProps : undefined;

	const [ randomizeThemeColors ] = useColorRandomizer( name );

	return (
		<VStack className="global-styles-ui-color-palette-panel" spacing={ 8 }>
			<VStack spacing={ 4 }>
				{ !! themeColors && !! themeColors.length && (
					<PaletteEdit
						canReset={ themeColors !== baseThemeColors }
						canOnlyChangeValues
						colors={ themeColors }
						onChange={ setThemeColors }
						paletteLabel={ __( 'Theme' ) }
						paletteLabelHeadingLevel={ 3 }
						paletteVariations={ [
							...( hasLightColors
								? [
										{
											canReset:
												userLightColors !== undefined,
											colors: normalizedLightColors,
											onChange: setLightColors,
											paletteIcon: (
												<SchemePaletteIcon scheme="light" />
											),
											paletteLabel: __( 'Light palette' ),
										},
								  ]
								: [] ),
							...( hasDarkColors
								? [
										{
											canReset:
												userDarkColors !== undefined,
											colors: normalizedDarkColors,
											onChange: setDarkColors,
											paletteIcon: (
												<SchemePaletteIcon scheme="dark" />
											),
											paletteLabel: __( 'Dark palette' ),
										},
								  ]
								: [] ),
						] }
						popoverProps={ popoverProps }
					/>
				) }
				{ ( window as any ).__experimentalEnableColorRandomizer &&
					themeColors?.length > 0 &&
					randomizeThemeColors && (
						<Button
							__next40pxDefaultSize
							variant="secondary"
							icon={ shuffle }
							onClick={ randomizeThemeColors }
						>
							{ __( 'Randomize colors' ) }
						</Button>
					) }
			</VStack>
			{ !! defaultColors &&
				!! defaultColors.length &&
				!! defaultPaletteEnabled && (
					<PaletteEdit
						canReset={ defaultColors !== baseDefaultColors }
						canOnlyChangeValues
						colors={ defaultColors }
						onChange={ setDefaultColors }
						paletteLabel={ __( 'Default' ) }
						paletteLabelHeadingLevel={ 3 }
						popoverProps={ popoverProps }
					/>
				) }
			<PaletteEdit
				colors={ customColors }
				onChange={ setCustomColors }
				paletteLabel={ __( 'Custom' ) }
				paletteLabelHeadingLevel={ 3 }
				slugPrefix="custom-"
				popoverProps={ popoverProps }
			/>
			<ColorVariations title={ __( 'Palettes' ) } />
		</VStack>
	);
}
