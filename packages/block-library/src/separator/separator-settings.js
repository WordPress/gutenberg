/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';

const SeparatorSettings = ( { color, setColor } ) => (
	<InspectorControls>
		<PanelColorSettings
			__experimentalHasMultipleOrigins
			__experimentalIsRenderedInSidebar
			title={ __( 'Color' ) }
			colorSettings={ [
				{
					value: color.color,
					onChange: setColor,
					label: __( 'Color' ),
				},
			] }
		></PanelColorSettings>
	</InspectorControls>
);

export default SeparatorSettings;
