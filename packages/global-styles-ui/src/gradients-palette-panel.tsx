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
	ColorSchemePreset,
	Gradient,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { useSetting } from './hooks';
import {
	addBasePresetNames,
	flattenSchemePresets,
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
	const [ lightGradients, setLightGradients ] = useSetting<
		SchemePresetCollection< ColorSchemePreset< Gradient > >
	>( 'color.light.gradients', name );
	const [ userLightGradients ] = useSetting<
		SchemePresetCollection< ColorSchemePreset< Gradient > >
	>( 'color.light.gradients', name, 'user' );
	const [ darkGradients, setDarkGradients ] = useSetting<
		SchemePresetCollection< ColorSchemePreset< Gradient > >
	>( 'color.dark.gradients', name );
	const [ userDarkGradients ] = useSetting<
		SchemePresetCollection< ColorSchemePreset< Gradient > >
	>( 'color.dark.gradients', name, 'user' );

	const namedLightGradients = addBasePresetNames(
		flattenSchemePresets( lightGradients ),
		themeGradients
	);
	const namedDarkGradients = addBasePresetNames(
		flattenSchemePresets( darkGradients ),
		themeGradients
	);
	const hasLightGradients = namedLightGradients.length > 0;
	const hasDarkGradients = namedDarkGradients.length > 0;

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
					popoverProps={ popoverProps }
				/>
			) }
			{ hasLightGradients && (
				<PaletteEdit
					canReset={ userLightGradients !== undefined }
					canOnlyChangeValues
					gradients={ namedLightGradients }
					onChange={ setLightGradients }
					paletteLabel={ __( 'Light gradients' ) }
					paletteIcon={ <SchemePaletteIcon scheme="light" /> }
					paletteLabelHeadingLevel={ 3 }
					popoverProps={ popoverProps }
				/>
			) }
			{ hasDarkGradients && (
				<PaletteEdit
					canReset={ userDarkGradients !== undefined }
					canOnlyChangeValues
					gradients={ namedDarkGradients }
					onChange={ setDarkGradients }
					paletteLabel={ __( 'Dark gradients' ) }
					paletteIcon={ <SchemePaletteIcon scheme="dark" /> }
					paletteLabelHeadingLevel={ 3 }
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
