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
	return name === 'core/image' && settings?.lightbox?.allowEditing;
}

export default function ImageSettingsPanel( {
	onChange,
	userSettings,
	settings,
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

	let lightboxChecked = false;

	if ( settings?.lightbox === true ) {
		lightboxChecked = true;
	} else if ( settings?.lightbox?.enabled ) {
		lightboxChecked = settings.lightbox.enabled;
	}

	return (
		<>
			<ToolsPanel
				label={ _x( 'Settings', 'Image settings' ) }
				resetAll={ resetLightbox }
				panelId={ panelId }
			>
				<ToolsPanelItem
					// We use the `userSettings` prop instead of `settings`, because `settings`
					// contains the core/theme values for the lightbox and we want to show the
					// "RESET" button ONLY when the user has explicitly set a value in the
					// Global Styles.
					hasValue={ () => !! userSettings?.lightbox }
					label={ __( 'Expand on Click' ) }
					onDeselect={ resetLightbox }
					isShownByDefault={ true }
					panelId={ panelId }
				>
					<ToggleControl
						label={ __( 'Expand on Click' ) }
						checked={ lightboxChecked }
						onChange={ onChangeLightbox }
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</>
	);
}
