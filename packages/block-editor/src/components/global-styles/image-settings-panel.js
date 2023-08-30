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

function ImageToolsPanel( {
	resetAllSettings,
	onChange,
	settings,
	panelId,
	children,
} ) {
	const resetAll = () => {
		const updatedValue = resetAllSettings( settings );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ _x( 'Settings', 'Image settings' ) }
			resetAll={ resetAll }
			panelId={ panelId }
		>
			{ children }
		</ToolsPanel>
	);
}

export default function ImageSettingsPanel( {
	as: Wrapper = ImageToolsPanel,
	name,
	onChange,
	settings,
	panelId,
} ) {
	const hasImageSettingsPanel = useHasImageSettingsPanel( name );

	return (
		<>
			<Wrapper
				resetAllSettings={ () => {
					onChange( false );
				} }
				settings={ settings }
				onChange={ onChange }
				panelId={ panelId }
			>
				{ hasImageSettingsPanel && (
					<ToolsPanelItem
						hasValue={ () => true }
						label={ __( 'Expand on Click' ) }
						onDeselect={ () => onChange( false ) }
						isShownByDefault={ true }
						panelId={ panelId }
					>
						<ToggleControl
							label={ __( 'Expand on Click' ) }
							checked={
								settings.lightbox
									? settings.lightbox.enabled
									: false
							}
							onChange={ ( newValue ) => {
								onChange( newValue );
							} }
						/>
					</ToolsPanelItem>
				) }
			</Wrapper>
		</>
	);
}
