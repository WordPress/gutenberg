/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalVStack as VStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	ToggleControl,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import OverlayTemplatePartSelector from './overlay-template-part-selector';
import OverlayMenuIcon from './overlay-menu-icon';

/**
 * Overlay Panel component for Navigation block.
 *
 * @param {Object}   props                          Component props.
 * @param {string}   props.overlayMenu              Overlay menu setting ('never', 'mobile', 'always').
 * @param {string}   props.overlayTemplatePart      Currently selected overlay template part ID.
 * @param {Function} props.setAttributes            Function to update block attributes.
 * @param {Function} props.onNavigateToEntityRecord Function to navigate to template part editor.
 * @param {boolean}  props.overlayMenuPreview       Whether overlay menu preview is open.
 * @param {Function} props.setOverlayMenuPreview    Function to toggle overlay menu preview.
 * @param {boolean}  props.hasIcon                  Whether the overlay menu has an icon.
 * @param {string}   props.icon                     Icon type for overlay menu.
 * @param {string}   props.overlayMenuPreviewClasses CSS classes for overlay menu preview button.
 * @param {string}   props.overlayMenuPreviewId     ID for overlay menu preview.
 * @param {boolean}  props.isResponsive             Whether overlay menu is responsive.
 * @return {JSX.Element|null} The overlay panel component or null if overlay is disabled.
 */
export default function OverlayPanel( {
	overlayMenu,
	overlayTemplatePart,
	setAttributes,
	onNavigateToEntityRecord,
	overlayMenuPreview,
	setOverlayMenuPreview,
	hasIcon,
	icon,
	overlayMenuPreviewClasses,
	overlayMenuPreviewId,
	isResponsive,
} ) {
	return (
		<PanelBody title={ __( 'Overlay' ) } initialOpen>
			<VStack spacing={ 4 }>
				<ToggleGroupControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Overlay Visibility' ) }
					aria-label={ __( 'Configure overlay visibility' ) }
					value={ overlayMenu }
					help={ __(
						'Collapses the navigation options in a menu icon opening an overlay.'
					) }
					onChange={ ( value ) =>
						setAttributes( { overlayMenu: value } )
					}
					isBlock
				>
					<ToggleGroupControlOption
						value="never"
						label={ __( 'Off' ) }
					/>
					<ToggleGroupControlOption
						value="mobile"
						label={ __( 'Mobile' ) }
					/>
					<ToggleGroupControlOption
						value="always"
						label={ __( 'Always' ) }
					/>
				</ToggleGroupControl>

				{ isResponsive && overlayMenu !== 'never' && (
					<>
						<Button
							__next40pxDefaultSize
							className={ overlayMenuPreviewClasses }
							onClick={ () => {
								setOverlayMenuPreview( ! overlayMenuPreview );
							} }
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
							>
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Show icon button' ) }
									help={ __(
										'Configure the visual appearance of the button that toggles the overlay menu.'
									) }
									onChange={ ( value ) =>
										setAttributes( { hasIcon: value } )
									}
									checked={ hasIcon }
								/>
								<ToggleGroupControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									className="wp-block-navigation__overlay-menu-icon-toggle-group"
									label={ __( 'Icon' ) }
									value={ icon }
									onChange={ ( value ) =>
										setAttributes( { icon: value } )
									}
									isBlock
								>
									<ToggleGroupControlOption
										value="handle"
										aria-label={ __( 'handle' ) }
										label={ <OverlayMenuIcon icon="handle" /> }
									/>
									<ToggleGroupControlOption
										value="menu"
										aria-label={ __( 'menu' ) }
										label={ <OverlayMenuIcon icon="menu" /> }
									/>
								</ToggleGroupControl>
							</VStack>
						) }
					</>
				) }

				{ overlayMenu !== 'never' && (
					<OverlayTemplatePartSelector
						overlayTemplatePart={ overlayTemplatePart }
						setAttributes={ setAttributes }
						onNavigateToEntityRecord={ onNavigateToEntityRecord }
					/>
				) }
			</VStack>
		</PanelBody>
	);
}
