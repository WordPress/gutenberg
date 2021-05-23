/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import InspectorControls from '../inspector-controls';
import useEditorFeature from '../use-editor-feature';

export default function SpacingPanelControl( { children, ...props } ) {
	const isSpacingEnabled = useEditorFeature( 'spacing.customPadding' );

	if ( ! isSpacingEnabled ) return null;
	const styles = children?.props?.attributes?.style?.spacing?.padding;
	const topPX = parseInt( styles?.top );
	const clientWidth = window.screen.width / 2;
	if ( styles && topPX > clientWidth ) {
		alert( 'Very big padding , script will refresh padding' );
		styles.top = '20px';
		styles.left = '20px';
		styles.bottom = '20px';
		styles.right = '20px';
	}

	return (
		<InspectorControls { ...props }>
			<PanelBody title={ __( 'Spacing' ) }>{ children }</PanelBody>
		</InspectorControls>
	);
}
