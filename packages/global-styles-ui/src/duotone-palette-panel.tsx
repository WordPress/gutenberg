/**
 * WordPress dependencies
 */
import type {
	ColorSchemeSettings,
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
	normalizeColorSchemePresets,
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

	const [ lightScheme ] = useSetting< ColorSchemeSettings >(
		'color.light',
		name
	);
	const [ lightDuotones ] = useSetting< SchemePresetCollection< Duotone > >(
		'color.light.duotone',
		name
	);
	const [ darkScheme ] = useSetting< ColorSchemeSettings >(
		'color.dark',
		name
	);
	const [ darkDuotones ] = useSetting< SchemePresetCollection< Duotone > >(
		'color.dark.duotone',
		name
	);

	const normalizedLightDuotones = normalizeColorSchemePresets(
		themeDuotones,
		lightDuotones
	);
	const normalizedDarkDuotones = normalizeColorSchemePresets(
		themeDuotones,
		darkDuotones
	);
	const hasLightDuotones =
		lightScheme !== undefined && normalizedLightDuotones.length > 0;
	const hasDarkDuotones =
		darkScheme !== undefined && normalizedDarkDuotones.length > 0;

	return (
		<Stack
			direction="column"
			gap="lg"
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
					duotones={ normalizedLightDuotones }
					label={ __( 'Light duotone' ) }
					scheme="light"
				/>
			) }
			{ hasDarkDuotones && (
				<DuotonePalette
					duotones={ normalizedDarkDuotones }
					label={ __( 'Dark duotone' ) }
					scheme="dark"
				/>
			) }
		</Stack>
	);
}
