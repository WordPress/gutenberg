/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import {
	PanelBody,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { CSS_UNITS, MARGIN_CONSTRAINTS, parseUnit } from './shared';

const SeparatorSettings = ( {
	color,
	setColor,
	attributes,
	setAttributes,
} ) => {
	const { style } = attributes;
	const { top, bottom } = style?.spacing?.margin || {};

	const topUnit = parseUnit( top );
	const bottomUnit = parseUnit( bottom );

	const updateMargins = ( margins ) => {
		setAttributes( {
			style: {
				...style,
				spacing: {
					...style?.spacing,
					margin: margins,
				},
			},
		} );
	};

	const createHandleMarginChange = ( side ) => ( value ) => {
		updateMargins( {
			...style?.spacing?.margin,
			[ side ]: value,
		} );
	};

	const onUnitChange = ( unit ) => {
		updateMargins( {
			top: MARGIN_CONSTRAINTS[ unit ].default,
			bottom: MARGIN_CONSTRAINTS[ unit ].default,
		} );
	};

	return (
		<InspectorControls>
			<PanelColorSettings
				title={ __( 'Color settings' ) }
				colorSettings={ [
					{
						value: color.color,
						onChange: setColor,
						label: __( 'Color' ),
					},
				] }
			/>
			<PanelBody title={ __( 'Separator settings' ) }>
				<UnitControl
					label={ __( 'Top margin' ) }
					max={ MARGIN_CONSTRAINTS[ topUnit ].max }
					min={ MARGIN_CONSTRAINTS[ topUnit ].min }
					onChange={ createHandleMarginChange( 'top' ) }
					onUnitChange={ onUnitChange }
					step={ topUnit === 'px' ? '1' : '0.25' }
					style={ { marginBottom: '8px' } }
					units={ CSS_UNITS }
					value={ top }
				/>
				<UnitControl
					label={ __( 'Bottom margin' ) }
					max={ MARGIN_CONSTRAINTS[ bottomUnit ].max }
					min={ MARGIN_CONSTRAINTS[ bottomUnit ].min }
					onChange={ createHandleMarginChange( 'bottom' ) }
					onUnitChange={ onUnitChange }
					step={ bottomUnit === 'px' ? '1' : '0.25' }
					units={ CSS_UNITS }
					value={ bottom }
				/>
			</PanelBody>
		</InspectorControls>
	);
};

export default SeparatorSettings;
