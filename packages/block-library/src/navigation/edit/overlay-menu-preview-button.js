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
 * @param {boolean}  props.hasIcon                   Whether the overlay menu has an icon.
 * @param {string}   props.icon                      Icon type for overlay menu.
 * @param {Function} props.setAttributes             Function to update block attributes.
 * @param {string}   props.overlayMenuPreviewClasses CSS classes for overlay menu preview button.
 * @param {string}   props.overlayMenuPreviewId      ID for overlay menu preview.
 * @param {string}   props.containerStyle            Optional style for the preview container.
 * @return {JSX.Element|null}                       The overlay menu preview button or null if not responsive.
 */
export default function OverlayMenuPreviewButton( {
	isResponsive,
	overlayMenuPreview,
	setOverlayMenuPreview,
	hasIcon,
	icon,
	setAttributes,
	overlayMenuPreviewClasses,
	overlayMenuPreviewId,
	containerStyle,
} ) {
	if ( ! isResponsive ) {
		return null;
	}

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
			</Button>
			{ overlayMenuPreview && (
				<VStack
					id={ overlayMenuPreviewId }
					spacing={ 4 }
					style={ containerStyle }
				>
					<OverlayMenuPreviewControls
						hasIcon={ hasIcon }
						icon={ icon }
						setAttributes={ setAttributes }
					/>
				</VStack>
			) }
		</>
	);
}
