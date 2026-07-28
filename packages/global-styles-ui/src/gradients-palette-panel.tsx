/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalVStack as VStack,
	__experimentalPaletteEdit as PaletteEdit,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type {
	ColorSchemeSettings,
	Gradient,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { useSetting } from './hooks';
import {
	normalizeColorSchemePresets,
	SchemePaletteIcon,
	type SchemePresetCollection,
} from './color-scheme-palette';

const mobilePopoverProps = { placement: 'bottom-start' as const, offset: 8 };

interface GradientPalettePanelProps {
	name?: string;
}

export default function GradientPalettePanel( {
	name,
}: GradientPalettePanelProps ) {
	const [ themeGradients, setThemeGradients ] = useSetting< Gradient[] >(
		'color.gradients.theme',
		name
	);
	const [ baseThemeGradients ] = useSetting< Gradient[] >(
		'color.gradients.theme',
		name,
		'base'
	);
	const [ defaultGradients, setDefaultGradients ] = useSetting< Gradient[] >(
		'color.gradients.default',
		name
	);
	const [ baseDefaultGradients ] = useSetting< Gradient[] >(
		'color.gradients.default',
		name,
		'base'
	);
	const [ customGradients, setCustomGradients ] = useSetting< Gradient[] >(
		'color.gradients.custom',
		name
	);
	const [ lightScheme ] = useSetting< ColorSchemeSettings >(
		'color.light',
		name
	);
	const [ lightGradients, setLightGradients ] = useSetting<
		SchemePresetCollection< Gradient >
	>( 'color.light.gradients', name );
	const [ userLightGradients ] = useSetting<
		SchemePresetCollection< Gradient >
	>( 'color.light.gradients', name, 'user' );
	const [ darkScheme ] = useSetting< ColorSchemeSettings >(
		'color.dark',
		name
	);
	const [ darkGradients, setDarkGradients ] = useSetting<
		SchemePresetCollection< Gradient >
	>( 'color.dark.gradients', name );
	const [ userDarkGradients ] = useSetting<
		SchemePresetCollection< Gradient >
	>( 'color.dark.gradients', name, 'user' );

	const normalizedLightGradients = normalizeColorSchemePresets(
		themeGradients,
		lightGradients
	);
	const normalizedDarkGradients = normalizeColorSchemePresets(
		themeGradients,
		darkGradients
	);
	const hasLightGradients =
		lightScheme !== undefined && normalizedLightGradients.length > 0;
	const hasDarkGradients =
		darkScheme !== undefined && normalizedDarkGradients.length > 0;

	const [ defaultPaletteEnabled ] = useSetting< boolean >(
		'color.defaultGradients',
		name
	);

	const isMobileViewport = useViewportMatch( 'small', '<' );
	const popoverProps = isMobileViewport ? mobilePopoverProps : undefined;

	return (
		<VStack
			className="global-styles-ui-gradient-palette-panel"
			spacing={ 8 }
		>
			{ !! themeGradients && !! themeGradients.length && (
				<PaletteEdit
					canReset={ themeGradients !== baseThemeGradients }
					canOnlyChangeValues
					gradients={ themeGradients }
					onChange={ setThemeGradients }
					paletteLabel={ __( 'Theme' ) }
					paletteLabelHeadingLevel={ 3 }
					paletteVariations={ [
						...( hasLightGradients
							? [
									{
										canReset:
											userLightGradients !== undefined,
										gradients: normalizedLightGradients,
										onChange: setLightGradients,
										paletteIcon: (
											<SchemePaletteIcon scheme="light" />
										),
										paletteLabel: __( 'Light gradients' ),
									},
							  ]
							: [] ),
						...( hasDarkGradients
							? [
									{
										canReset:
											userDarkGradients !== undefined,
										gradients: normalizedDarkGradients,
										onChange: setDarkGradients,
										paletteIcon: (
											<SchemePaletteIcon scheme="dark" />
										),
										paletteLabel: __( 'Dark gradients' ),
									},
							  ]
							: [] ),
					] }
					popoverProps={ popoverProps }
				/>
			) }
			{ !! defaultGradients &&
				!! defaultGradients.length &&
				!! defaultPaletteEnabled && (
					<PaletteEdit
						canReset={ defaultGradients !== baseDefaultGradients }
						canOnlyChangeValues
						gradients={ defaultGradients }
						onChange={ setDefaultGradients }
						paletteLabel={ __( 'Default' ) }
						paletteLabelHeadingLevel={ 3 }
						popoverProps={ popoverProps }
					/>
				) }
			<PaletteEdit
				gradients={ customGradients }
				onChange={ setCustomGradients }
				paletteLabel={ __( 'Custom' ) }
				paletteLabelHeadingLevel={ 3 }
				slugPrefix="custom-"
				popoverProps={ popoverProps }
			/>
		</VStack>
	);
}
