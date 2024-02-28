/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalPaletteEdit as PaletteEdit,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import ColorVariations from './variations-color';
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );
const mobilePopoverProps = { placement: 'bottom-start', offset: 8 };

export default function ColorPalettePanel( { name } ) {
	const [ themeColors, setThemeColors ] = useGlobalSetting(
		'color.palette.theme',
		name
	);
	const [ baseThemeColors ] = useGlobalSetting(
		'color.palette.theme',
		name,
		'base'
	);
	const [ defaultColors, setDefaultColors ] = useGlobalSetting(
		'color.palette.default',
		name
	);
	const [ baseDefaultColors ] = useGlobalSetting(
		'color.palette.default',
		name,
		'base'
	);
	const [ customColors, setCustomColors ] = useGlobalSetting(
		'color.palette.custom',
		name
	);

	const [ defaultPaletteEnabled ] = useGlobalSetting(
		'color.defaultPalette',
		name
	);
	const colorVariations = useCurrentMergeThemeStyleVariationsWithUserConfig( {
		property: 'color',
		filter: ( variation ) =>
			variation?.settings?.color &&
			Object.keys( variation?.settings?.color ).length,
	} );
	const isMobileViewport = useViewportMatch( 'small', '<' );
	const popoverProps = isMobileViewport ? mobilePopoverProps : undefined;

	return (
		<VStack
			className="edit-site-global-styles-color-palette-panel"
			spacing={ 10 }
		>
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
			{ !! colorVariations.length && (
				<ColorVariations variations={ colorVariations } />
			) }
			<PaletteEdit
				colors={ customColors }
				onChange={ setCustomColors }
				paletteLabel={ __( 'Custom' ) }
				paletteLabelHeadingLevel={ 3 }
				emptyMessage={ __(
					'Custom colors are empty! Add some colors to create your own color palette.'
				) }
				slugPrefix="custom-"
				popoverProps={ popoverProps }
			/>
		</VStack>
	);
}
