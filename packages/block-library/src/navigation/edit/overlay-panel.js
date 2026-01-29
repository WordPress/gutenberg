/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import OverlayTemplatePartSelector from './overlay-template-part-selector';
import OverlayVisibilityControl from './overlay-visibility-control';
import OverlayMenuPreviewButton from './overlay-menu-preview-button';
import OverlayPreview from './overlay-preview';

/**
 * Overlay Panel component for Navigation block.
 *
 * @param {Object}   props                           Component props.
 * @param {string}   props.overlayMenu               Overlay menu setting ('never', 'mobile', 'always').
 * @param {string}   props.overlay                   Currently selected overlay template part ID.
 * @param {Function} props.setAttributes             Function to update block attributes.
 * @param {Function} props.onNavigateToEntityRecord  Function to navigate to template part editor.
 * @param {boolean}  props.overlayMenuPreview        Whether overlay menu preview is open.
 * @param {Function} props.setOverlayMenuPreview     Function to toggle overlay menu preview.
 * @param {boolean}  props.hasIcon                   Whether the overlay menu has an icon.
 * @param {string}   props.icon                      Icon type for overlay menu.
 * @param {string}   props.overlayMenuPreviewClasses CSS classes for overlay menu preview button.
 * @param {string}   props.overlayMenuPreviewId      ID for overlay menu preview.
 * @param {boolean}  props.isResponsive              Whether overlay menu is responsive.
 * @param {string}   props.currentTheme              Current theme stylesheet name.
 * @return {JSX.Element|null}                       The overlay panel component or null if overlay is disabled.
 */
export default function OverlayPanel( {
	overlayMenu,
	overlay,
	setAttributes,
	onNavigateToEntityRecord,
	overlayMenuPreview,
	setOverlayMenuPreview,
	hasIcon,
	icon,
	overlayMenuPreviewClasses,
	overlayMenuPreviewId,
	isResponsive,
	currentTheme,
} ) {
	return (
		<PanelBody title={ __( 'Overlay' ) } initialOpen>
			<VStack spacing={ 4 }>
				<OverlayVisibilityControl
					overlayMenu={ overlayMenu }
					setAttributes={ setAttributes }
				/>

				{ overlayMenu !== 'never' && (
					<OverlayMenuPreviewButton
						isResponsive={ isResponsive }
						overlayMenuPreview={ overlayMenuPreview }
						setOverlayMenuPreview={ setOverlayMenuPreview }
						hasIcon={ hasIcon }
						icon={ icon }
						setAttributes={ setAttributes }
						overlayMenuPreviewClasses={ overlayMenuPreviewClasses }
						overlayMenuPreviewId={ overlayMenuPreviewId }
					/>
				) }

				{ overlayMenu !== 'never' && (
					<OverlayTemplatePartSelector
						overlay={ overlay }
						setAttributes={ setAttributes }
						onNavigateToEntityRecord={ onNavigateToEntityRecord }
					/>
				) }

				{ overlayMenu !== 'never' && overlay && (
					<OverlayPreview
						overlay={ overlay }
						currentTheme={ currentTheme }
					/>
				) }
			</VStack>
		</PanelBody>
	);
}
