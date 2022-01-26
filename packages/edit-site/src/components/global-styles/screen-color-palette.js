/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
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
			<ToggleGroupControl
				className="edit-site-screen-color-palette-toggle"
				value={ currentTab }
				onChange={ setCurrentTab }
				label={ __( 'Select palette type' ) }
				hideLabelFromVision
				isBlock
			>
				<ToggleGroupControlOption
					value="solid"
					label={ __( 'Solid' ) }
				/>
				<ToggleGroupControlOption
					value="gradient"
					label={ __( 'Gradient' ) }
				/>
			</ToggleGroupControl>
			{ currentTab === 'solid' && <ColorPalettePanel name={ name } /> }
			{ currentTab === 'gradient' && (
				<GradientPalettePanel name={ name } />
			) }
		</>
	);
}

export default ScreenColorPalette;
