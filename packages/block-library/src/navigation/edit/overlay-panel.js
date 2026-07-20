/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalVStack as VStack,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import OverlayTemplatePartSelector from './overlay-template-part-selector';
import OverlayVisibilityControl from './overlay-visibility-control';
import OverlayMenuPreviewButton from './overlay-menu-preview-button';
import OverlayPreview from './overlay-preview';
import { normalizeCollapsedMenuBreakpoint } from './utils';
import {
	DEFAULT_COLLAPSED_MENU_BREAKPOINT,
	COLLAPSED_MENU_BREAKPOINT_UNITS,
} from '../constants';

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
 * @param {boolean}  props.hasOverlays               Whether any overlay template parts exist.
 * @param {string}   props.collapsedMenuBreakpoint   Breakpoint at which the overlay switches to inline layout.
 * @return {React.JSX.Element}                       The overlay panel component or null if overlay is disabled.
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
	hasOverlays,
	collapsedMenuBreakpoint = DEFAULT_COLLAPSED_MENU_BREAKPOINT,
} ) {
	const [ isCreatingOverlay, setIsCreatingOverlay ] = useState( false );

	const handleCollapsedMenuBreakpointChange = ( nextValue ) => {
		setAttributes( {
			collapsedMenuBreakpoint:
				normalizeCollapsedMenuBreakpoint( nextValue ),
		} );
	};

	return (
		<PanelBody title={ __( 'Overlay' ) } initialOpen>
			<VStack spacing={ 4 }>
				<OverlayVisibilityControl
					overlayMenu={ overlayMenu }
					setAttributes={ setAttributes }
				/>

				{ overlayMenu !== 'never' && (
					<UnitControl
						help={ __(
							'Below this width, the navigation is collapsed behind a menu button. At this width and wider, links are shown inline.'
						) }
						isResetValueOnUnitChange
						label={ __( 'Breakpoint' ) }
						min={ 0 }
						onChange={ handleCollapsedMenuBreakpointChange }
						step="any"
						units={ COLLAPSED_MENU_BREAKPOINT_UNITS }
						value={ normalizeCollapsedMenuBreakpoint(
							collapsedMenuBreakpoint
						) }
					/>
				) }

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
						overlayMenu={ overlayMenu }
						setAttributes={ setAttributes }
						onNavigateToEntityRecord={ onNavigateToEntityRecord }
						isCreatingOverlay={ isCreatingOverlay }
						setIsCreatingOverlay={ setIsCreatingOverlay }
					/>
				) }

				{ overlayMenu !== 'never' &&
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
