/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

export function useHasImageSettingsPanel( name, value, inheritedValue ) {
	// Note: If lightbox `value` exists, that means it was
	// defined via the the Global Styles UI and will NOT
	// be a boolean value or contain the `allowEditing` property,
	// so we should show the settings panel in those cases.
	return (
		( name === 'core/image' && inheritedValue?.lightbox?.allowEditing ) ||
		!! value?.lightbox
	);
}

export default function ImageSettingsPanel( {
	onChange,
	value,
	inheritedValue,
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

	if ( inheritedValue?.lightbox?.enabled ) {
		lightboxChecked = inheritedValue.lightbox.enabled;
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
					hasValue={ () => !! value?.lightbox }
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
