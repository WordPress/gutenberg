/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	ToggleControl,
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
 * @param {Object}   props               Component props.
 * @param {boolean}  props.hasIcon       Whether the overlay menu has an icon.
 * @param {string}   props.icon          Icon type for overlay menu.
 * @param {Function} props.setAttributes Function to update block attributes.
 * @return {JSX.Element}                The overlay menu preview controls.
 */
export default function OverlayMenuPreviewControls( {
	hasIcon,
	icon,
	setAttributes,
} ) {
	return (
		<VStack spacing={ 4 }>
			<ToggleControl
				label={ __( 'Show icon button' ) }
				help={ __(
					'Configure the visual appearance of the button that toggles the overlay menu.'
				) }
				onChange={ ( value ) => setAttributes( { hasIcon: value } ) }
				checked={ hasIcon }
			/>
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
		</VStack>
	);
}
