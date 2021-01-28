/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { RangeControl, PanelBody } from '@wordpress/components';

const SeparatorSettings = ( props ) => {
	const {
		color,
		setColor,
		height,
		minHeight,
		maxHeight,
		updateHeight,
	} = props;

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Spacer settings' ) }>
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
};

export default SeparatorSettings;
