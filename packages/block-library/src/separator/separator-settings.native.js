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
					key={ `separator-top-margin-${ bottomUnit }` }
					min={ MARGIN_CONSTRAINTS[ topUnit ].min }
					max={ MARGIN_CONSTRAINTS[ topUnit ].max }
					value={ topValue || MARGIN_CONSTRAINTS[ topUnit ].min }
					unit={ topUnit }
					units={ CSS_UNITS }
					onChange={ createHandleMarginChange( 'top', topUnit ) }
					onUnitChange={ onUnitChange }
					decimalNum={ 1 }
					step={ topUnit === 'px' ? 1 : 0.1 }
				/>
				<UnitControl
					label={ __( 'Bottom margin' ) }
					key={ `separator-bottom-margin-${ bottomUnit }` }
					min={ MARGIN_CONSTRAINTS[ bottomUnit ].min }
					max={ MARGIN_CONSTRAINTS[ bottomUnit ].max }
					value={
						bottomValue || MARGIN_CONSTRAINTS[ bottomUnit ].min
					}
					unit={ bottomUnit }
					units={ CSS_UNITS }
					onChange={ createHandleMarginChange(
						'bottom',
						bottomUnit
					) }
					onUnitChange={ onUnitChange }
					decimalNum={ 1 }
					step={ bottomUnit === 'px' ? 1 : 0.1 }
				/>
			</PanelBody>
		</InspectorControls>
	);
};

export default SeparatorSettings;
