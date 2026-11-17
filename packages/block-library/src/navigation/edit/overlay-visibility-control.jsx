import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Overlay Visibility Control component.
 *
 * Tablet is offered only when the theme has a tablet breakpoint, matching the
 * editor's device preview. A saved Tablet value is still shown, and stays
 * shown after choosing another option, so moving through the options with the
 * keyboard does not remove the one just left.
 *
 * @param {Object}   props                   Component props.
 * @param {string}   props.overlayMenu       Overlay menu setting ('never', 'mobile', 'tablet', 'always').
 * @param {Function} props.setAttributes     Function to update block attributes.
 * @param {boolean}  props.hasTabletViewport Whether the theme has a tablet breakpoint.
 * @return {React.JSX.Element}                     The overlay visibility control.
 */
export default function OverlayVisibilityControl( {
	overlayMenu,
	setAttributes,
	hasTabletViewport,
} ) {
	const [ isInitiallyTablet ] = useState( overlayMenu === 'tablet' );
	const showTablet =
		hasTabletViewport || isInitiallyTablet || overlayMenu === 'tablet';

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
			{ showTablet && (
				<ToggleGroupControlOption
					value="tablet"
					label={ __( 'Tablet' ) }
				/>
			) }
			<ToggleGroupControlOption value="always" label={ __( 'Always' ) } />
		</ToggleGroupControl>
	);
}
