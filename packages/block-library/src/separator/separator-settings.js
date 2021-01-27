/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	PanelColorSettings,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/block-editor';
import { BaseControl, PanelBody } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';

const HEIGHT_CSS_UNITS = [
	{ value: 'px', label: 'px', default: 0 },
	{ value: 'em', label: 'em', default: 0 },
	{ value: 'rem', label: 'rem', default: 0 },
];

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
	const unitControlInstanceId = useInstanceId( UnitControl );
	const unitControlInputId = `wp-block-separator__height-${ unitControlInstanceId }`;

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Separator settings' ) }>
				<BaseControl label={ __( 'Height' ) } id={ unitControlInputId }>
					<UnitControl
						id={ unitControlInputId }
						min={ minHeight }
						max={ maxHeight }
						onChange={ updateHeight }
						onUnitChange={ updateHeightUnit }
						value={ `${ height }${ heightUnit }` }
						unit={ heightUnit }
						units={ HEIGHT_CSS_UNITS }
						step={ heightUnit === 'px' ? '1' : '0.25' }
					/>
				</BaseControl>
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
