/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { PanelBody, UnitControl } from '@wordpress/components';

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
	const topValue = top
		? parseFloat( top )
		: MARGIN_CONSTRAINTS[ topUnit ].min;
	const bottomValue = bottom
		? parseFloat( bottom )
		: MARGIN_CONSTRAINTS[ bottomUnit ].min;

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

	const createHandleMarginChange = ( side, unit ) => ( value ) => {
		updateMargins( {
			...style?.spacing?.margin,
			[ side ]: `${ value }${ unit }`,
		} );
	};

	const onUnitChange = ( unit ) => {
		// When setting the default on native the UnitControl input doesn't
		// update with the new value. Instead of using MARGIN_CONSTRAINTS[ unit ].default
		// The current value is going to be applied in the settings so the UI
		// is at least consistent.
		updateMargins( {
			top: `${ topValue }${ unit }`,
			bottom: `${ bottomValue }${ unit }`,
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
					min={ MARGIN_CONSTRAINTS[ topUnit ].min }
					max={ MARGIN_CONSTRAINTS[ topUnit ].max }
					value={ topValue }
					unit={ topUnit }
					units={ CSS_UNITS }
					onChange={ createHandleMarginChange( 'top', topUnit ) }
					onUnitChange={ onUnitChange }
					decimalNum={ 1 }
					key={ 'separator-top-margin' }
				/>
				<UnitControl
					label={ __( 'Bottom margin' ) }
					min={ MARGIN_CONSTRAINTS[ bottomUnit ].min }
					max={ MARGIN_CONSTRAINTS[ bottomUnit ].max }
					value={ bottomValue }
					unit={ bottomUnit }
					units={ CSS_UNITS }
					onChange={ createHandleMarginChange(
						'bottom',
						bottomUnit
					) }
					onUnitChange={ onUnitChange }
					decimalNum={ 1 }
					key={ 'separator-bottom-margin' }
				/>
			</PanelBody>
		</InspectorControls>
	);
};

export default SeparatorSettings;
