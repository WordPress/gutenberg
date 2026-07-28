/**
 * WordPress dependencies
 */
import type {
	ColorSchemePreset,
	Duotone,
} from '@wordpress/global-styles-engine';
import { DuotonePicker } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useSetting } from './hooks';
import { Subtitle } from './subtitle';
import {
	addBasePresetNames,
	flattenSchemePresets,
	SchemePaletteIcon,
	type ColorScheme,
	type SchemePresetCollection,
} from './color-scheme-palette';

interface DuotonePalettePanelProps {
	name?: string;
}

interface DuotonePaletteProps {
	duotones: Duotone[];
	label: string;
	scheme?: ColorScheme;
}

function DuotonePalette( { duotones, label, scheme }: DuotonePaletteProps ) {
	return (
		<Stack direction="column" gap="sm">
			<Subtitle level={ 3 }>
				{ scheme && <SchemePaletteIcon scheme={ scheme } /> }
				{ label }
			</Subtitle>
			<DuotonePicker
				aria-label={
					scheme
						? sprintf(
								// translators: %s: palette label, e.g. "Dark duotone".
								__( '%s palette' ),
								label
						  )
						: __( 'Theme duotone palette' )
				}
				duotonePalette={ duotones }
				disableCustomDuotone
				disableCustomColors
				clearable={ false }
				unsetable={ false }
				onChange={ () => {} }
				colorPalette={ [] }
			/>
		</Stack>
	);
}

export default function DuotonePalettePanel( {
	name,
}: DuotonePalettePanelProps ) {
	const [ customDuotones ] = useSetting< Duotone[] >(
		'color.duotone.custom',
		name
	);
	const [ defaultDuotones ] = useSetting< Duotone[] >(
		'color.duotone.default',
		name
	);
	const [ themeDuotones ] = useSetting< Duotone[] >(
		'color.duotone.theme',
		name
	);
	const [ defaultDuotoneEnabled ] = useSetting< boolean >(
		'color.defaultDuotone',
		name
	);
	const duotonePalette = [
		...( customDuotones ?? [] ),
		...( themeDuotones ?? [] ),
		...( defaultDuotones && defaultDuotoneEnabled ? defaultDuotones : [] ),
	];

	const [ lightDuotones ] = useSetting<
		SchemePresetCollection< ColorSchemePreset< Duotone > >
	>( 'color.light.duotone', name );
	const [ darkDuotones ] = useSetting<
		SchemePresetCollection< ColorSchemePreset< Duotone > >
	>( 'color.dark.duotone', name );

	const namedLightDuotones = addBasePresetNames(
		flattenSchemePresets( lightDuotones ),
		themeDuotones
	);
	const namedDarkDuotones = addBasePresetNames(
		flattenSchemePresets( darkDuotones ),
		themeDuotones
	);
	const hasLightDuotones = namedLightDuotones.length > 0;
	const hasDarkDuotones = namedDarkDuotones.length > 0;

	return (
		<Stack
			direction="column"
			gap="2xl"
			className="global-styles-ui-duotone-palette-panel"
		>
			{ duotonePalette.length > 0 && (
				<DuotonePalette
					duotones={ duotonePalette }
					label={ __( 'Theme' ) }
				/>
			) }
			{ hasLightDuotones && (
				<DuotonePalette
					duotones={ namedLightDuotones }
					label={ __( 'Light duotone' ) }
					scheme="light"
				/>
			) }
			{ hasDarkDuotones && (
				<DuotonePalette
					duotones={ namedDarkDuotones }
					label={ __( 'Dark duotone' ) }
					scheme="dark"
				/>
			) }
		</Stack>
	);
}
