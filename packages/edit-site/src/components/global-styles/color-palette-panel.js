/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalPaletteEdit as PaletteEdit,
	__experimentalVStack as VStack,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { shuffle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import ColorVariations from './variations/variations-color';
import { useColorRandomizer } from './hooks';

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
	const isMobileViewport = useViewportMatch( 'small', '<' );
	const popoverProps = isMobileViewport ? mobilePopoverProps : undefined;

	const [ randomizeThemeColors ] = useColorRandomizer();

	return (
		<VStack
			className="edit-site-global-styles-color-palette-panel"
			spacing={ 8 }
		>
			{ !! themeColors && !! themeColors.length && (
				<>
					<PaletteEdit
						canReset={ themeColors !== baseThemeColors }
						canOnlyChangeValues
						colors={ themeColors }
						onChange={ setThemeColors }
						paletteLabel={ __( 'Theme' ) }
						paletteLabelHeadingLevel={ 3 }
						popoverProps={ popoverProps }
					/>
					{ window.__experimentalEnableColorRandomizer &&
						themeColors?.length > 0 && (
							<Button
								__next40pxDefaultSize
								variant="secondary"
								icon={ shuffle }
								onClick={ randomizeThemeColors }
							>
								{ __( 'Randomize colors' ) }
							</Button>
						) }
				</>
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
