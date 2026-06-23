/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import OverlayMenuIcon from './overlay-menu-icon';
import OverlayMenuPreviewControls from './overlay-menu-preview-controls';

/**
 * Overlay Menu Preview Button component.
 *
 * @param {Object}   props               Component props.
 * @param {boolean}  props.isResponsive  Whether overlay menu is responsive.
 * @param {boolean}  props.hasIcon       Whether the overlay menu has an icon.
 * @param {string}   props.icon          Icon type for overlay menu.
 * @param {Function} props.setAttributes Function to update block attributes.
 * @return {React.JSX.Element}           The overlay menu preview or null if not responsive.
 */
export default function OverlayMenuPreviewButton( {
	isResponsive,
	hasIcon,
	icon,
	setAttributes,
} ) {
	if ( ! isResponsive ) {
		return null;
	}

	return (
		<>
			<div
				className="wp-block-navigation__overlay-menu-preview"
				role="img"
				aria-label={ __( 'Overlay menu button preview showing three lines hamburger menu to open the overlay and X to close it' ) }
			>
				{ hasIcon && (
					<>
						<OverlayMenuIcon icon={ icon } />
						<Icon icon={ close } />
					</>
				) }
				{ ! hasIcon && (
					<>
						<span>{ __( 'Menu' ) }</span>
						<span>{ __( 'Close' ) }</span>
					</>
				) }
			</div>
			<OverlayMenuPreviewControls
				hasIcon={ hasIcon }
				icon={ icon }
				setAttributes={ setAttributes }
			/>
		</>
	);
}
