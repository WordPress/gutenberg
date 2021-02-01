/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { PanelBody, UnitControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { HEIGHT_CSS_UNITS } from './shared';

const SeparatorSettings = ( props ) => {
	const {
		color,
		setColor,
		height,
		heightUnit,
		minHeight,
		maxHeight,
		updateHeight,
		updateHeightUnit,
	} = props;

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Separator settings' ) }>
				<UnitControl
					label={ __( 'Height' ) }
					min={ minHeight }
					max={ maxHeight }
					onChange={ updateHeight }
					onUnitChange={ updateHeightUnit }
					value={ height }
					unit={ heightUnit }
					units={ HEIGHT_CSS_UNITS }
					decimalNum={ 1 }
					key={ heightUnit }
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
