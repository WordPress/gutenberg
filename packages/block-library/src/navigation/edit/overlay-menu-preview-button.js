/**
 * WordPress dependencies
 */
import { Button, __experimentalVStack as VStack } from '@wordpress/components';
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
 * @param {Object}   props                           Component props.
 * @param {boolean}  props.isResponsive              Whether overlay menu is responsive.
 * @param {boolean}  props.overlayMenuPreview        Whether overlay menu preview is open.
 * @param {Function} props.setOverlayMenuPreview     Function to toggle overlay menu preview.
 * @param {boolean}  props.hasIcon                   Whether the overlay menu has an icon (legacy).
 * @param {string}   props.overlayOpenButtonDisplay  Display mode for the toggle button ('icon', 'text', or 'both').
 * @param {string}   props.icon                      Icon type for overlay menu.
 * @param {Function} props.setAttributes             Function to update block attributes.
 * @param {string}   props.overlayMenuPreviewClasses CSS classes for overlay menu preview button.
 * @param {string}   props.overlayMenuPreviewId      ID for overlay menu preview.
 * @param {string}   props.containerStyle            Optional style for the preview container.
 * @return {React.JSX.Element}                                  The overlay menu preview button or null if not responsive.
 */
export default function OverlayMenuPreviewButton( {
	isResponsive,
	overlayMenuPreview,
	setOverlayMenuPreview,
	hasIcon,
	overlayOpenButtonDisplay,
	icon,
	setAttributes,
	overlayMenuPreviewClasses,
	overlayMenuPreviewId,
	containerStyle,
} ) {
	if ( ! isResponsive ) {
		return null;
	}

	// Derive display mode: new attribute takes precedence; fall back to legacy hasIcon.
	const displayMode =
		overlayOpenButtonDisplay ?? ( hasIcon !== false ? 'icon' : 'text' );
	const showIcon = displayMode === 'icon' || displayMode === 'both';
	const showText = displayMode === 'text' || displayMode === 'both';

	return (
		<>
			<Button
				__next40pxDefaultSize
				className={ overlayMenuPreviewClasses }
				onClick={ () => setOverlayMenuPreview( ! overlayMenuPreview ) }
				aria-label={ __( 'Overlay menu controls' ) }
				aria-controls={ overlayMenuPreviewId }
				aria-expanded={ overlayMenuPreview }
			>
				{ /* Open button preview */ }
				<span className="wp-block-navigation__toggle-button-preview">
					{ showIcon && <OverlayMenuIcon icon={ icon } /> }
					{ showText && __( 'Menu' ) }
				</span>
				{ /* Close button preview */ }
				<span className="wp-block-navigation__toggle-button-preview">
					{ showIcon && <Icon icon={ close } /> }
					{ showText && __( 'Close' ) }
				</span>
			</Button>
			{ overlayMenuPreview && (
				<VStack
					id={ overlayMenuPreviewId }
					spacing={ 4 }
					style={ containerStyle }
				>
					<OverlayMenuPreviewControls
						overlayOpenButtonDisplay={ overlayOpenButtonDisplay }
						icon={ icon }
						setAttributes={ setAttributes }
					/>
				</VStack>
			) }
		</>
	);
}
