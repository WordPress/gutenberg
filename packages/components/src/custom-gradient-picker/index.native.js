/**
 * WordPress dependencies
 */
import { PanelBody, RadioControl, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { colorsUtils } from '../mobile/color-settings/utils';
import { getGradientAstWithDefault } from './utils';
import { serializeGradient } from './serializer';
import {
	DEFAULT_LINEAR_GRADIENT_ANGLE,
	HORIZONTAL_GRADIENT_ORIENTATION,
} from './constants';
import styles from './style.scss';

function CustomGradientPicker( { setColor, currentValue, isGradientColor } ) {
	const [ gradientOrientation, setGradientOrientation ] = useState(
		HORIZONTAL_GRADIENT_ORIENTATION
	);

	const [ currentColor, setCurrentColor ] = useState( currentValue );

	const { getGradientType, gradients, gradientOptions } = colorsUtils;
	const { gradientAST } = getGradientAstWithDefault( currentColor );
	const gradientType = getGradientType( currentColor );

	function isLinearGradient( type ) {
		return type === gradients.linear;
	}

	function getGradientColor( type ) {
		const { orientation, ...restGradientAST } = gradientAST;

		if ( orientation ) {
			setGradientOrientation( orientation );
		}

		return serializeGradient(
			isLinearGradient( type )
				? {
						...gradientAST,
						...( gradientAST.orientation
							? {}
							: {
									orientation: gradientOrientation,
							  } ),
						type,
				  }
				: {
						...restGradientAST,
						type,
				  }
		);
	}

	function onGradientTypeChange( type ) {
		const gradientColor = getGradientColor( type );
		setCurrentColor( gradientColor );
		setColor( gradientColor );
	}

	function setGradientAngle( value ) {
		const gradientColor = serializeGradient( {
			...gradientAST,
			orientation: {
				type: 'angular',
				value,
			},
		} );

		if ( isGradientColor && gradientColor !== currentColor ) {
			setCurrentColor( gradientColor );
			setColor( gradientColor );
		}
	}

	function getGradientAngle() {
		return gradientAST?.orientation?.value ?? DEFAULT_LINEAR_GRADIENT_ANGLE;
	}
	return (
		<>
			<PanelBody title={ __( 'Gradient Type' ) }>
				<RadioControl
					selected={ gradientType }
					options={ gradientOptions }
					onChange={ onGradientTypeChange }
				/>
			</PanelBody>
			{ isLinearGradient( gradientType ) && (
				<PanelBody style={ styles.angleControl }>
					<RangeControl
						label={ __( 'Angle' ) }
						minimumValue={ 0 }
						maximumValue={ 360 }
						value={ getGradientAngle() }
						onChange={ setGradientAngle }
					/>
				</PanelBody>
			) }
		</>
	);
}

export default CustomGradientPicker;
