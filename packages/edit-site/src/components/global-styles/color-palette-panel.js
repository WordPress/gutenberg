/**
 * WordPress dependencies
 */
import {
	__experimentalPaletteEdit as PaletteEdit,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSetting } from './hooks';

export default function ColorPalettePanel( { name } ) {
	const [ themeColors, setThemeColors ] = useSetting(
		'color.palette.theme',
		name
	);
	const [ baseThemeColors ] = useSetting(
		'color.palette.theme',
		name,
		'base'
	);
	const [ defaultColors, setDefaultColors ] = useSetting(
		'color.palette.default',
		name
	);
	const [ baseDefaultColors ] = useSetting(
		'color.palette.default',
		name,
		'base'
	);
	const [ customColors, setCustomColors ] = useSetting(
		'color.palette.custom',
		name
	);

	const [ defaultPaletteEnabled ] = useSetting(
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
					/>
				) }
			<PaletteEdit
				colors={ customColors }
				onChange={ setCustomColors }
				paletteLabel={ __( 'Custom' ) }
				emptyMessage={ __(
					'Custom colors are empty! Add some colors to create your own color palette.'
				) }
				slugPrefix="custom-"
			/>
		</VStack>
	);
}
