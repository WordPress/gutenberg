import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	ToggleControl,
} from '@wordpress/components';
import { InputControl, Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import OverlayMenuIcon from './overlay-menu-icon';

/**
 * Overlay Menu Preview Controls component.
 * Used within PanelBody context (not ToolsPanel).
 *
 * @param {Object}   props                    Component props.
 * @param {boolean}  props.hasIcon            Whether the overlay menu has an icon.
 * @param {string}   props.icon               Icon type for overlay menu.
 * @param {string}   props.overlayButtonLabel Text label for overlay menu button.
 * @param {Function} props.setAttributes      Function to update block attributes.
 * @return {React.JSX.Element}                The overlay menu preview controls.
 */
export default function OverlayMenuPreviewControls( {
	hasIcon,
	icon,
	overlayButtonLabel,
	setAttributes,
} ) {
	return (
		<Stack direction="column" gap={ 4 }>
			<ToggleControl
				label={ __( 'Show icon button' ) }
				help={ __(
					'Configure the visual appearance of the button that toggles the overlay menu.'
				) }
				onChange={ ( value ) => setAttributes( { hasIcon: value } ) }
				checked={ hasIcon }
			/>
			{ ! hasIcon && (
				<InputControl
					label={ __( 'Button label' ) }
					value={ overlayButtonLabel || '' }
					placeholder={ __( 'Menu' ) }
					onValueChange={ ( value ) =>
						setAttributes( { overlayButtonLabel: value } )
					}
					help={ __(
						'Text label for the button that opens the overlay menu.'
					) }
				/>
			) }
			{ hasIcon && (
				<ToggleGroupControl
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
		</Stack>
	);
}
