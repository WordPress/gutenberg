/**
 * WordPress dependencies
 */
import {
	__experimentalPaletteEdit as PaletteEdit,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { experiments as blockEditorExperiments } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../experiments';

const { useGlobalSetting } = unlock( blockEditorExperiments );

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
					/>
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
			/>
		</VStack>
	);
}
