import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import useHasTabletViewport from './use-has-tablet-viewport';

/**
 * Overlay Visibility Control component.
 *
 * Tablet is offered only when the theme has a tablet breakpoint, matching the
 * editor's device preview, but stays visible while selected so a saved value
 * is still shown.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.overlayMenu   Overlay menu setting ('never', 'mobile', 'tablet', 'always').
 * @param {Function} props.setAttributes Function to update block attributes.
 * @return {React.JSX.Element}                 The overlay visibility control.
 */
export default function OverlayVisibilityControl( {
	overlayMenu,
	setAttributes,
} ) {
	const hasTabletViewport = useHasTabletViewport();

	return (
		<ToggleGroupControl
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
			{ ( hasTabletViewport || overlayMenu === 'tablet' ) && (
				<ToggleGroupControlOption
					value="tablet"
					label={ __( 'Tablet' ) }
				/>
			) }
			<ToggleGroupControlOption value="always" label={ __( 'Always' ) } />
		</ToggleGroupControl>
	);
}
