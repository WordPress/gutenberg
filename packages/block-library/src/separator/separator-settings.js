/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';

const SeparatorSettings = ( { color, setColor } ) => (
	<InspectorControls>
		<PanelColorSettings
			title={ __( 'Color Settings' ) }
			colorSettings={ [
				{
					value: color.color,
					onChange: setColor,
					label: __( 'Color' ),
				},
			] }
		>
		</PanelColorSettings>
	</InspectorControls>
);

export default SeparatorSettings;
