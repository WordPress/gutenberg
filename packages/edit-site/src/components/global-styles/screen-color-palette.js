/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ColorPalettePanel from './color-palette-panel';
import ScreenHeader from './header';

function ScreenColorPalette( { name } ) {
	const parentMenu = name === undefined ? '' : '/blocks/' + name;

	return (
		<>
			<ScreenHeader
				back={ parentMenu + '/colors' }
				title={ __( 'Color Palette' ) }
				description={ __(
					'Color palettes are used to provide default color options for blocks and various design tools. Here you can edit the colors with their labels.'
				) }
			/>
			<ColorPalettePanel name={ name } />
		</>
	);
}

export default ScreenColorPalette;
