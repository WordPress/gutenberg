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
import { CSS_UNITS, parseUnit } from './shared';

const SeparatorSettings = ( props ) => {
	const {
		color,
		setColor,
		marginConstraints,
		marginUnit,
		separatorStyles: style,
		setAttributes,
	} = props;
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
		const defaultValue = marginConstraints[ unit ].default;
		updateMargins( {
			top: defaultValue,
			bottom: defaultValue,
		} );
	};

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Separator settings' ) }>
				<UnitControl
					label={ __( 'Top margin' ) }
					min={ marginConstraints[ topUnit ].min }
					max={ marginConstraints[ topUnit ].max }
					onChange={ createHandleMarginChange( 'top' ) }
					value={ style?.spacing?.margin?.top }
					unit={ marginUnit } // Needed to force unit selection to update after box resizing.
					units={ CSS_UNITS }
					onUnitChange={ onUnitChange }
					step={ topUnit === 'px' ? '1' : '0.25' }
					style={ { marginBottom: '8px' } }
				/>
				<UnitControl
					label={ __( 'Bottom margin' ) }
					min={ marginConstraints[ bottomUnit ].min }
					max={ marginConstraints[ bottomUnit ].max }
					onChange={ createHandleMarginChange( 'bottom' ) }
					value={ style?.spacing?.margin?.bottom }
					unit={ marginUnit } // Needed to force unit selection to update after box resizing.
					units={ CSS_UNITS }
					onUnitChange={ onUnitChange }
					step={ bottomUnit === 'px' ? '1' : '0.25' }
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
