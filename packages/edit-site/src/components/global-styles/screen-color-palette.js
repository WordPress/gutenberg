/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ColorPalettePanel from './color-palette-panel';
import GradientPalettePanel from './gradients-palette-panel';
import ScreenHeader from './header';
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

function ScreenColorPalette( { name } ) {
	return (
		<>
			<ScreenHeader
				title={ __( 'Edit palette' ) }
				description={ __(
					'The combination of colors used across the site and in color pickers.'
				) }
			/>
			<Tabs>
				<Tabs.TabList>
					<Tabs.Tab tabId="color">{ __( 'Color' ) }</Tabs.Tab>
					<Tabs.Tab tabId="gradient">{ __( 'Gradient' ) }</Tabs.Tab>
				</Tabs.TabList>
				<Tabs.TabPanel tabId="color" focusable={ false }>
					<ColorPalettePanel name={ name } />
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId="gradient" focusable={ false }>
					<GradientPalettePanel name={ name } />
				</Tabs.TabPanel>
			</Tabs>
		</>
	);
}

export default ScreenColorPalette;
