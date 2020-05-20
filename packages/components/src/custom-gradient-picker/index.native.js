/**
 * External dependencies
 */
import { get, omit } from 'lodash';
/**
 * WordPress dependencies
 */
import {
	PanelBody,
	CycleSelectControl,
	RangeControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { colorsUtils } from '../mobile/color-settings/utils';
import { performLayoutAnimation } from '../mobile/utils';
import { getGradientParsed } from './utils';
import { serializeGradient } from './serializer';
import {
	DEFAULT_LINEAR_GRADIENT_ANGLE,
	HORIZONTAL_GRADIENT_ORIENTATION,
} from './constants';

function CustomGradientPicker( { currentValue, setColor, isGradientColor } ) {
	const { getGradientType, gradients, gradientOptions } = colorsUtils;

	const gradientType = getGradientType( currentValue ) || gradients.linear;
	const isLinearGradient = gradientType === gradients.linear;

	function getGradientColor( type ) {
		const { gradientAST } = getGradientParsed( currentValue );

		return serializeGradient(
			type === gradients.linear
				? {
						...gradientAST,
						...( gradientAST.orientation
							? {}
							: {
									orientation: HORIZONTAL_GRADIENT_ORIENTATION,
							  } ),
						type,
				  }
				: {
						...omit( gradientAST, [ 'orientation' ] ),
						type,
				  }
		);
	}

	function onGradientTypeChange( type ) {
		const gradientColor = getGradientColor( type );
		performLayoutAnimation();
		setColor( gradientColor );
	}

	function setGradientAngle( value ) {
		const { gradientAST } = getGradientParsed( currentValue );

		const gradientColor = serializeGradient( {
			...gradientAST,
			orientation: {
				type: 'angular',
				value,
			},
		} );

		if ( isGradientColor && gradientColor !== currentValue ) {
			setColor( gradientColor );
		}
	}

	function getGradientAngle() {
		const { gradientAST } = getGradientParsed( currentValue );
		return get(
			gradientAST,
			[ 'orientation', 'value' ],
			DEFAULT_LINEAR_GRADIENT_ANGLE
		);
	}

	return (
		<PanelBody>
			<CycleSelectControl
				label={ __( 'Gradient Type' ) }
				value={ gradientType }
				onChangeValue={ onGradientTypeChange }
				options={ gradientOptions }
			/>
			{ isLinearGradient && (
				<RangeControl
					label={ __( 'Angle' ) }
					minimumValue={ 0 }
					maximumValue={ 360 }
					value={ getGradientAngle() }
					onChange={ setGradientAngle }
				/>
			) }
		</PanelBody>
	);
}

export default CustomGradientPicker;
