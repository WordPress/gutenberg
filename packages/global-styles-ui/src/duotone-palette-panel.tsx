import { useViewportMatch } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { __experimentalPaletteEdit as PaletteEdit } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import type { Color, Duotone } from '@wordpress/global-styles-engine';
import { useSetting } from './hooks';

const mobilePopoverProps = { placement: 'bottom-start' as const, offset: 8 };

// Presets come from `theme.json`, so they are not guaranteed to be arrays.
const asArray = < T, >( value: T[] | undefined ) =>
	Array.isArray( value ) ? value : [];

interface DuotonePalettePanelProps {
	name?: string;
}

export default function DuotonePalettePanel( {
	name,
}: DuotonePalettePanelProps ) {
	const [ themeDuotone, setThemeDuotone ] = useSetting< Duotone[] >(
		'color.duotone.theme',
		name
	);
	const [ baseThemeDuotone ] = useSetting< Duotone[] >(
		'color.duotone.theme',
		name,
		'base'
	);
	const [ defaultDuotone, setDefaultDuotone ] = useSetting< Duotone[] >(
		'color.duotone.default',
		name
	);
	const [ baseDefaultDuotone ] = useSetting< Duotone[] >(
		'color.duotone.default',
		name,
		'base'
	);
	const [ customDuotone, setCustomDuotone ] = useSetting< Duotone[] >(
		'color.duotone.custom',
		name
	);

	const [ defaultDuotoneEnabled ] = useSetting< boolean >(
		'color.defaultDuotone',
		name
	);

	// The colors offered when picking a duotone's shadows and highlights, and
	// from which the value of a newly added duotone is derived.
	const [ themeColors ] = useSetting< Color[] >(
		'color.palette.theme',
		name
	);
	const [ defaultColors ] = useSetting< Color[] >(
		'color.palette.default',
		name
	);
	const [ customColors ] = useSetting< Color[] >(
		'color.palette.custom',
		name
	);
	const [ defaultPaletteEnabled ] = useSetting< boolean >(
		'color.defaultPalette',
		name
	);

	// A stable array, so the filtering and darkest/lightest lookups that
	// `PaletteEdit` and `DuotonePicker` memoize on it are not redone on every
	// render.
	const colorPalette = useMemo(
		() => [
			...asArray( customColors ),
			...asArray( themeColors ),
			...( defaultPaletteEnabled ? asArray( defaultColors ) : [] ),
		],
		[ customColors, themeColors, defaultColors, defaultPaletteEnabled ]
	);

	const isMobileViewport = useViewportMatch( 'small', '<' );
	const popoverProps = isMobileViewport ? mobilePopoverProps : undefined;

	return (
		<Stack
			direction="column"
			className="global-styles-ui-duotone-palette-panel"
			gap="2xl"
		>
			{ !! asArray( themeDuotone ).length && (
				<PaletteEdit
					canReset={ themeDuotone !== baseThemeDuotone }
					canOnlyChangeValues
					duotones={ asArray( themeDuotone ) }
					colorPalette={ colorPalette }
					onChange={ setThemeDuotone }
					paletteLabel={ __( 'Theme' ) }
					paletteLabelHeadingLevel={ 3 }
					popoverProps={ popoverProps }
				/>
			) }
			{ !! asArray( defaultDuotone ).length &&
				!! defaultDuotoneEnabled && (
					<PaletteEdit
						canReset={ defaultDuotone !== baseDefaultDuotone }
						canOnlyChangeValues
						duotones={ asArray( defaultDuotone ) }
						colorPalette={ colorPalette }
						onChange={ setDefaultDuotone }
						paletteLabel={ __( 'Default' ) }
						paletteLabelHeadingLevel={ 3 }
						popoverProps={ popoverProps }
					/>
				) }
			<PaletteEdit
				duotones={ asArray( customDuotone ) }
				colorPalette={ colorPalette }
				onChange={ setCustomDuotone }
				paletteLabel={ __( 'Custom' ) }
				paletteLabelHeadingLevel={ 3 }
				slugPrefix="custom-"
				popoverProps={ popoverProps }
			/>
		</Stack>
	);
}
