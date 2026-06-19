/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { ScreenHeader } from './screen-header';
import ColorPalettePanel from './color-palette-panel';
import GradientPalettePanel from './gradients-palette-panel';

function ScreenColorPalette( { name }: { name?: string } ) {
	return (
		<>
			<ScreenHeader
				title={ __( 'Edit palette' ) }
				description={ __(
					'The combination of colors used across the site and in color pickers.'
				) }
			/>
			<Tabs.Root defaultValue="color">
				<Tabs.List>
					<Tabs.Tab value="color">{ __( 'Color' ) }</Tabs.Tab>
					<Tabs.Tab value="gradient">{ __( 'Gradient' ) }</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="color" tabIndex={ -1 }>
					<ColorPalettePanel name={ name } />
				</Tabs.Panel>
				<Tabs.Panel value="gradient" tabIndex={ -1 }>
					<GradientPalettePanel name={ name } />
				</Tabs.Panel>
			</Tabs.Root>
		</>
	);
}

export default ScreenColorPalette;
