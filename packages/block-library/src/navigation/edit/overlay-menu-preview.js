/**
 * WordPress dependencies
 */
import {
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import OverlayMenuIcon from './overlay-menu-icon';

export default function OverlayMenuPreview( { setAttributes, hasIcon, icon } ) {
	return (
		<>
			<ToggleControl
				label={ __( 'Show icon button' ) }
				help={ __(
					'Configure the visual appearance of the button opening the overlay menu.'
				) }
				onChange={ ( value ) => setAttributes( { hasIcon: value } ) }
				checked={ hasIcon }
			/>

			<ToggleGroupControl
				label={ __( 'Icon' ) }
				value={ icon }
				help={ __( 'Choose an icon or add your own.' ) }
				onChange={ ( value ) => setAttributes( { icon: value } ) }
			>
				<ToggleGroupControlOption
					value="handle"
					aria-label={ __( 'handle' ) }
					label={ <OverlayMenuIcon icon="handle" /> }
					className="wp-block-navigation__icon-button"
				/>
				<ToggleGroupControlOption
					value="menu"
					aria-label={ __( 'menu' ) }
					label={ <OverlayMenuIcon icon="menu" /> }
					className="wp-block-navigation__icon-button"
				/>
				<ToggleGroupControlOption
					value="more-vertical"
					aria-label={ __( 'more vertical' ) }
					label={ <OverlayMenuIcon icon="more-vertical" /> }
					className="wp-block-navigation__icon-button"
				/>
				<ToggleGroupControlOption
					value="more-horizontal"
					aria-label={ __( 'more horizontal' ) }
					label={ <OverlayMenuIcon icon="more-horizontal" /> }
					className="wp-block-navigation__icon-button"
				/>
			</ToggleGroupControl>
		</>
	);
}
