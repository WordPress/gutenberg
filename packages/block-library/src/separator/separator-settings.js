/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';

const SeparatorSettings = ( {
	color,
	setColor,
	height,
	minHeight,
	maxHeight,
	updateHeight,
} ) => (
	<InspectorControls>
		<PanelBody title={ __( 'Separator settings' ) }>
			<RangeControl
				label={ __( 'Height in pixels' ) }
				min={ minHeight }
				max={ maxHeight }
				value={ height }
				onChange={ updateHeight }
			/>
		</PanelBody>
		<PanelColorSettings
			title={ __( 'Color settings' ) }
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
