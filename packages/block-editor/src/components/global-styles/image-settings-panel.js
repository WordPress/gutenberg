/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

export function useHasImageSettingsPanel( name, settings ) {
	return name === 'core/image' && settings?.lightbox?.showUI;
}

export default function ImageSettingsPanel( {
	onChange,
	userSettings,
	panelId,
} ) {
	const resetLightbox = () => {
		onChange( undefined );
	};

	const onChangeLightbox = ( newSetting ) => {
		onChange( {
			enabled: newSetting,
		} );
	};

	return (
		<>
			<ToolsPanel
				label={ _x( 'Settings', 'Image settings' ) }
				resetAll={ resetLightbox }
				panelId={ panelId }
			>
				<ToolsPanelItem
					hasValue={ () => !! userSettings?.lightbox }
					label={ __( 'Expand on Click' ) }
					onDeselect={ resetLightbox }
					isShownByDefault={ true }
					panelId={ panelId }
				>
					<ToggleControl
						label={ __( 'Expand on Click' ) }
						// TODO: Figure out if we want to use the `userSettings` or the global
						// settings. If we use the global settings, this means that the
						// checkbox will be checked following the `theme.json` value.
						checked={ !! userSettings?.lightbox?.enabled }
						onChange={ onChangeLightbox }
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</>
	);
}
