/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import OverlayMenuIcon from './overlay-menu-icon';

/**
 * Overlay Menu Preview Controls component.
 * Used within PanelBody context (not ToolsPanel).
 *
 * @param {Object}   props                          Component props.
 * @param {string}   props.overlayOpenButtonDisplay Display mode for the toggle button ('icon', 'text', or 'both').
 * @param {string}   props.icon                     Icon type for overlay menu.
 * @param {Function} props.setAttributes            Function to update block attributes.
 * @return {React.JSX.Element}                The overlay menu preview controls.
 */
export default function OverlayMenuPreviewControls( {
	overlayOpenButtonDisplay,
	icon,
	setAttributes,
} ) {
	const showIconPicker = overlayOpenButtonDisplay !== 'text';

	return (
		<VStack spacing={ 4 }>
			<ToggleGroupControl
				__next40pxDefaultSize
				label={ __( 'Display Mode' ) }
				value={ overlayOpenButtonDisplay ?? 'icon' }
				onChange={ ( value ) =>
					setAttributes( {
						overlayOpenButtonDisplay: value,
					} )
				}
				isBlock
			>
				<ToggleGroupControlOption value="icon" label={ __( 'Icon' ) } />
				<ToggleGroupControlOption value="text" label={ __( 'Text' ) } />
				<ToggleGroupControlOption value="both" label={ __( 'Both' ) } />
			</ToggleGroupControl>
			{ showIconPicker && (
				<ToggleGroupControl
					__next40pxDefaultSize
					className="wp-block-navigation__overlay-menu-icon-toggle-group"
					label={ __( 'Icon' ) }
					value={ icon }
					onChange={ ( value ) => setAttributes( { icon: value } ) }
					isBlock
				>
					<ToggleGroupControlOption
						value="handle"
						aria-label={ __( 'handle' ) }
						label={ <OverlayMenuIcon icon="handle" /> }
					/>
					<ToggleGroupControlOption
						value="menu"
						aria-label={ __( 'menu' ) }
						label={ <OverlayMenuIcon icon="menu" /> }
					/>
				</ToggleGroupControl>
			) }
		</VStack>
	);
}
