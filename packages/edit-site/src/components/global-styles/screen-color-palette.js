/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useGlobalStylesContext } from '../editor/global-styles-provider';
import ColorPalettePanel from './color-palette-panel';
import ScreenHeader from './header';

function ScreenColorPalette( { name } ) {
	const { getSetting, setSetting } = useGlobalStylesContext();
	const parentMenu = name === undefined ? '' : '/blocks/' + name;

	return (
		<>
			<ScreenHeader
				back={ parentMenu + '/colors' }
				title={ __( 'Color Palette' ) }
				description={ __( 'Manage the color palette of your site' ) }
			/>
			<ColorPalettePanel
				contextName={ name }
				getSetting={ getSetting }
				setSetting={ setSetting }
			/>
		</>
	);
}

export default ScreenColorPalette;
