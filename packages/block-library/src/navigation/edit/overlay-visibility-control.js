/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Overlay Visibility Control component.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.overlayMenu   Overlay menu setting ('never', 'mobile', 'always').
 * @param {Function} props.setAttributes Function to update block attributes.
 * @return {JSX.Element}                 The overlay visibility control.
 */
export default function OverlayVisibilityControl( {
	overlayMenu,
	setAttributes,
} ) {
	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			label={ __( 'Overlay Visibility' ) }
			aria-label={ __( 'Configure overlay visibility' ) }
			value={ overlayMenu }
			help={ __(
				'Collapses the navigation options in a menu icon opening an overlay.'
			) }
			onChange={ ( value ) => setAttributes( { overlayMenu: value } ) }
			isBlock
		>
			<ToggleGroupControlOption value="never" label={ __( 'Off' ) } />
			<ToggleGroupControlOption value="mobile" label={ __( 'Mobile' ) } />
			<ToggleGroupControlOption value="always" label={ __( 'Always' ) } />
		</ToggleGroupControl>
	);
}
