/**
 * External dependencies
 */
import { get, omit } from 'lodash';
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
import { performLayoutAnimation } from '../mobile/layout-animation';
import { getGradientParsed } from './utils';
import { serializeGradient } from './serializer';
import {
	DEFAULT_LINEAR_GRADIENT_ANGLE,
	HORIZONTAL_GRADIENT_ORIENTATION,
} from './constants';
import styles from './style.scss';

function CustomGradientPicker( { currentValue, setColor, isGradientColor } ) {
	const [ gradientOrientation, setGradientOrientation ] = useState(
		HORIZONTAL_GRADIENT_ORIENTATION
	);

	const { getGradientType, gradients, gradientOptions } = colorsUtils;
	const { gradientAST } = getGradientParsed( currentValue );
	const gradientType = getGradientType( currentValue );

	function isLinearGradient( type ) {
		return type === gradients.linear;
	}

	function getGradientColor( type ) {
		const orientation = get( gradientAST, [ 'orientation' ] );

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
		return get(
			gradientAST,
			[ 'orientation', 'value' ],
			DEFAULT_LINEAR_GRADIENT_ANGLE
		);
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
