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

const SeparatorSettings = ( props ) => {
	const {
		color,
		setColor,
		marginUnit,
		separatorStyles: style,
		setAttributes,
	} = props;

	const { top, bottom } = style?.spacing?.margin || {};
	const topUnit = parseUnit( top );
	const bottomUnit = parseUnit( bottom );
	const topValue = top ? parseFloat( top ) : undefined;
	const bottomValue = bottom ? parseFloat( bottom ) : undefined;

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
			[ side ]: `${ value }${ marginUnit }`,
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
			<PanelBody title={ __( 'Separator settings' ) }>
				<UnitControl
					label={ __( 'Top margin' ) }
					min={ MARGIN_CONSTRAINTS[ topUnit ].min }
					max={ MARGIN_CONSTRAINTS[ topUnit ].max }
					value={ topValue || MARGIN_CONSTRAINTS[ topUnit ].min }
					unit={ topUnit }
					units={ CSS_UNITS }
					onChange={ createHandleMarginChange( 'top' ) }
					onUnitChange={ onUnitChange }
					decimalNum={ 1 }
					key={ `separator-top-margin-${ topUnit }` }
					step={ topUnit === 'px' ? 1 : 0.1 }
				/>
				<UnitControl
					label={ __( 'Bottom margin' ) }
					min={ MARGIN_CONSTRAINTS[ bottomUnit ].min }
					max={ MARGIN_CONSTRAINTS[ bottomUnit ].max }
					value={
						bottomValue || MARGIN_CONSTRAINTS[ bottomUnit ].min
					}
					unit={ bottomUnit }
					units={ CSS_UNITS }
					onChange={ createHandleMarginChange( 'bottom' ) }
					onUnitChange={ onUnitChange }
					decimalNum={ 1 }
					key={ `separator-bottom-margin-${ bottomUnit }` }
					step={ bottomUnit === 'px' ? 1 : 0.1 }
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
