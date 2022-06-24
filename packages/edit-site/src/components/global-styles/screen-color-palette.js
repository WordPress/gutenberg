/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	TabPanel,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorPalettePanel from './color-palette-panel';
import GradientPalettePanel from './gradients-palette-panel';
import ScreenHeader from './header';

function ScreenColorPalette( { name } ) {
	const [ currentTab, setCurrentTab ] = useState( 'solid' );

	return (
		<>
			<ScreenHeader
				title={ __( 'Palette' ) }
				description={ __(
					'Palettes are used to provide default color options for blocks and various design tools. Here you can edit the colors with their labels.'
				) }
			/>
			<TabPanel
				className="block-editor-color-gradient-control__tabs"
				onSelect={ setCurrentTab }
				tabs={ [
					{
						name: 'solid',
						title: 'Solid color',
						value: 'solid',
					},
					{
						name: 'gradient',
						title: 'Gradient',
						value: 'gradient',
					},
				] }
			>
			{ ( tab ) => <p className="screen-reader-text">Selected tab: { tab.title }</p> }
			</TabPanel>
			{ currentTab === 'solid' && <ColorPalettePanel name={ name } /> }
			{ currentTab === 'gradient' && (
				<GradientPalettePanel name={ name } />
			) }
		</>
	);
}

export default ScreenColorPalette;
