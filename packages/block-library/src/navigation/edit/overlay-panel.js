/**
 * WordPress dependencies
 */
import {
	Button,
	PanelBody,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { reset as resetIcon } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import OverlayTemplatePartSelector from './overlay-template-part-selector';
import OverlayVisibilityControl from './overlay-visibility-control';
import OverlayMenuPreviewButton from './overlay-menu-preview-button';
import OverlayPreview from './overlay-preview';
import {
	hasCustomOverlayBreakpoint,
	isValidOverlayBreakpoint,
	normalizeOverlayBreakpoint,
} from './utils';
import {
	DEFAULT_OVERLAY_BREAKPOINT,
	OVERLAY_BREAKPOINT_UNITS,
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
 * @param {string}   props.overlayBreakpoint         Breakpoint at which the overlay switches to inline layout.
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
	overlayBreakpoint = DEFAULT_OVERLAY_BREAKPOINT,
} ) {
	const [ isCreatingOverlay, setIsCreatingOverlay ] = useState( false );
	const normalizedOverlayBreakpoint =
		normalizeOverlayBreakpoint( overlayBreakpoint );
	const [ overlayBreakpointInputValue, setOverlayBreakpointInputValue ] =
		useState( normalizedOverlayBreakpoint );
	const hasCustomOverlayBreakpointValue =
		hasCustomOverlayBreakpoint( overlayBreakpoint );

	// Keep the editable field in sync when the attribute changes outside direct
	// input, while still allowing partial/invalid draft values before commit.
	useEffect( () => {
		setOverlayBreakpointInputValue( normalizedOverlayBreakpoint );
	}, [ normalizedOverlayBreakpoint ] );

	const handleOverlayBreakpointChange = ( nextValue ) => {
		setOverlayBreakpointInputValue( nextValue );

		if ( isValidOverlayBreakpoint( nextValue ) ) {
			setAttributes( {
				overlayBreakpoint: normalizeOverlayBreakpoint( nextValue ),
			} );
		}
	};

	const commitOverlayBreakpoint = () => {
		const nextOverlayBreakpoint = normalizeOverlayBreakpoint(
			overlayBreakpointInputValue
		);

		setOverlayBreakpointInputValue( nextOverlayBreakpoint );

		if ( nextOverlayBreakpoint !== normalizedOverlayBreakpoint ) {
			setAttributes( {
				overlayBreakpoint: nextOverlayBreakpoint,
			} );
		}
	};

	const handleOverlayBreakpointKeyDown = ( event ) => {
		if ( event.key === 'Enter' ) {
			commitOverlayBreakpoint();
		}
	};

	const handleOverlayBreakpointReset = () => {
		setOverlayBreakpointInputValue( DEFAULT_OVERLAY_BREAKPOINT );
		setAttributes( {
			overlayBreakpoint: DEFAULT_OVERLAY_BREAKPOINT,
		} );
	};

	return (
		<PanelBody title={ __( 'Overlay' ) } initialOpen>
			<Stack direction="column" gap="lg">
				<OverlayVisibilityControl
					overlayMenu={ overlayMenu }
					setAttributes={ setAttributes }
				/>

				{ overlayMenu === 'mobile' && (
					<Stack direction="row" gap="sm" align="flex-start">
						<UnitControl
							help={ __(
								'Sets the width where navigation items switch from collapsed to inline.'
							) }
							isResetValueOnUnitChange
							label={ __( 'Overlay breakpoint' ) }
							min={ 0 }
							onBlur={ commitOverlayBreakpoint }
							onChange={ handleOverlayBreakpointChange }
							onKeyDown={ handleOverlayBreakpointKeyDown }
							step="any"
							units={ OVERLAY_BREAKPOINT_UNITS }
							value={ overlayBreakpointInputValue }
						/>
						{ hasCustomOverlayBreakpointValue && (
							<Button
								__next40pxDefaultSize
								icon={ resetIcon }
								label={ __( 'Reset overlay breakpoint' ) }
								onClick={ handleOverlayBreakpointReset }
								size="small"
							/>
						) }
					</Stack>
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
			</Stack>
		</PanelBody>
	);
}
