/**
 * External dependencies
 */
import { clamp } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { PanelBody, UnitControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { HEIGHT_CONSTRAINTS, HEIGHT_CSS_UNITS } from './shared';

const SeparatorSettings = ( props ) => {
	const { color, setColor, height, heightUnit, setAttributes } = props;
	const minHeight = HEIGHT_CONSTRAINTS[ heightUnit ].min;
	const maxHeight = HEIGHT_CONSTRAINTS[ heightUnit ].max;

	const updateHeight = ( value ) => {
		setAttributes( {
			height: clamp( parseFloat( value ), minHeight, maxHeight ),
			heightUnit,
		} );
	};

	const updateHeightUnit = ( value ) => {
		setAttributes( {
			height: HEIGHT_CONSTRAINTS[ value ].default,
			heightUnit: value,
		} );
	};

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
					step={ heightUnit === 'px' ? 1 : 0.1 }
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
