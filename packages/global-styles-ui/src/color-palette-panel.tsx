/**
 * WordPress dependencies
 */
import type { Color } from '@wordpress/global-styles-engine';
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
