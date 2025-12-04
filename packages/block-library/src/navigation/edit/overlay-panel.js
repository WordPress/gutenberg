/**
 * WordPress dependencies
 */
import { PanelBody, __experimentalVStack as VStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import OverlayTemplatePartSelector from './overlay-template-part-selector';

/**
 * Overlay Panel component for Navigation block.
 *
 * @param {Object}   props                          Component props.
 * @param {string}   props.overlayMenu              Overlay menu setting ('never', 'mobile', 'always').
 * @param {string}   props.overlayTemplatePart       Currently selected overlay template part ID.
 * @param {Function} props.setAttributes            Function to update block attributes.
 * @param {Function} props.onNavigateToEntityRecord Function to navigate to template part editor.
 * @return {JSX.Element|null} The overlay panel component or null if overlay is disabled.
 */
export default function OverlayPanel( {
	overlayMenu,
	overlayTemplatePart,
	setAttributes,
	onNavigateToEntityRecord,
} ) {
	// Only show panel when overlay is enabled
	if ( overlayMenu === 'never' ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Overlay' ) } initialOpen>
			<VStack spacing={ 4 }>
				<OverlayTemplatePartSelector
					overlayTemplatePart={ overlayTemplatePart }
					setAttributes={ setAttributes }
					onNavigateToEntityRecord={ onNavigateToEntityRecord }
				/>
			</VStack>
		</PanelBody>
	);
}

