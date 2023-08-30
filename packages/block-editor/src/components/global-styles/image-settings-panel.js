/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

export function useHasImageSettingsPanel( name ) {
	return name === 'core/image';
}

export default function ImageSettingsPanel( {
	name,
	onChange,
	settings,
	panelId,
} ) {
	const hasImageSettingsPanel = useHasImageSettingsPanel( name );

	const resetLightbox = () => {
		onChange( false );
	};

	const decodeValue = () => {
		return settings.lightbox ? settings.lightbox.enabled : false;
	};

	const lightbox = decodeValue();

	return (
		<>
			<ToolsPanel
				label={ _x( 'Settings', 'Image settings' ) }
				resetAll={ resetLightbox }
				panelId={ panelId }
			>
				{ hasImageSettingsPanel && (
					<ToolsPanelItem
						hasValue={ () => !! lightbox }
						label={ __( 'Expand on Click' ) }
						onDeselect={ resetLightbox }
						isShownByDefault={ true }
						panelId={ panelId }
					>
						<ToggleControl
							label={ __( 'Expand on Click' ) }
							checked={ lightbox }
							onChange={ ( newValue ) => {
								onChange( newValue );
							} }
						/>
					</ToolsPanelItem>
				) }
			</ToolsPanel>
		</>
	);
}
