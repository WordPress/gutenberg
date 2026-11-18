import {
	PanelBody,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import OverlayTemplatePartSelector from './overlay-template-part-selector';
import OverlayVisibilityControl from './overlay-visibility-control';
import OverlayMenuPreviewButton from './overlay-menu-preview-button';
import OverlayPreview from './overlay-preview';
import useHasTabletViewport from './use-has-tablet-viewport';
import { getOverlayViewports, isOverlayResponsive } from '../overlay-viewports';

/**
 * Overlay Panel component for Navigation block.
 *
 * @param {Object}   props                           Component props.
 * @param {string}   props.overlayMenu               Overlay menu setting ('never', 'mobile', 'tablet', 'always').
 * @param {?Object}  props.overlayViewports          Viewport map from `getFilteredOverlayViewports()`, or `null` for the default `mobile` behavior.
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
 * @param {boolean}  props.hasOverlays               Whether any overlay template parts exist.
 * @return {React.JSX.Element}                       The overlay panel component or null if overlay is disabled.
 */
export default function OverlayPanel( {
	overlayMenu,
	overlayViewports,
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
	hasOverlays,
} ) {
	const [ isCreatingOverlay, setIsCreatingOverlay ] = useState( false );
	const hasTabletViewport = useHasTabletViewport();
	// The `overlay` attribute is shared by every language, while the filtered
	// viewports follow the current one, so show the overlay settings when
	// either the saved setting or the filtered viewports show the overlay.
	const isOverlayShown =
		isOverlayResponsive( getOverlayViewports( { overlayMenu } ) ) ||
		isOverlayResponsive( overlayViewports );

	return (
		<PanelBody title={ __( 'Overlay' ) } initialOpen>
			<VStack spacing={ 4 }>
				<OverlayVisibilityControl
					overlayMenu={ overlayMenu }
					setAttributes={ setAttributes }
					hasTabletViewport={ hasTabletViewport }
				/>

				{ isOverlayShown && (
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

				{ isOverlayShown && (
					<OverlayTemplatePartSelector
						overlay={ overlay }
						overlayViewports={ overlayViewports }
						hasTabletViewport={ hasTabletViewport }
						setAttributes={ setAttributes }
						onNavigateToEntityRecord={ onNavigateToEntityRecord }
						isCreatingOverlay={ isCreatingOverlay }
						setIsCreatingOverlay={ setIsCreatingOverlay }
					/>
				) }

				{ isOverlayShown &&
					overlay &&
					hasOverlays &&
					! isCreatingOverlay && (
						<OverlayPreview
							overlay={ overlay }
							currentTheme={ currentTheme }
						/>
					) }
			</VStack>
		</PanelBody>
	);
}
