/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TabPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ColorPalettePanel from './color-palette-panel';
import GradientPalettePanel from './gradients-palette-panel';
import ScreenHeader from './header';

function ScreenColorPalette( { name } ) {
	return (
		<>
			<ScreenHeader
				title={ __( 'Palette' ) }
				description={ __(
					'Palettes are used to provide default color options for blocks and various design tools. Here you can edit the colors with their labels.'
				) }
			/>
			<TabPanel
				tabs={ [
					{
						name: 'solid',
						title: 'Solid',
						value: 'solid',
					},
					{
						name: 'gradient',
						title: 'Gradient',
						value: 'gradient',
					},
				] }
			>
				{ ( tab ) => (
					<>
						{ tab.value === 'solid' && (
							<ColorPalettePanel name={ name } />
						) }
						{ tab.value === 'gradient' && (
							<GradientPalettePanel name={ name } />
						) }
					</>
				) }
			</TabPanel>
		</>
	);
}

export default ScreenColorPalette;
