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
				description={ __( 'Manage the color palette of your site' ) }
			/>
			<ColorPalettePanel name={ name } />
		</>
	);
}

export default ScreenColorPalette;
