/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as UnitControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CSS_UNITS, parseUnit } from './border';
import { cleanEmptyObject } from './utils';

const MIN_BORDER_RADIUS_VALUE = 0;

/**
 * Inspector control panel containing the border radius related configuration.
 *
 * @param  {Object} props Block properties.
 *
 * @return {WPElement} Border radius edit element.
 */
export function BorderRadiusEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	// Step value is maintained in state so step is appropriate for current unit
	// even when current radius value is undefined.
	const initialStep = parseUnit( style?.border?.radius ) === 'px' ? 1 : 0.25;
	const [ step, setStep ] = useState( initialStep );

	const onUnitChange = ( newUnit ) => {
		setStep( newUnit === 'px' ? 1 : 0.25 );
	};

	const onChange = ( newRadius ) => {
		let newStyle = {
			...style,
			border: {
				...style?.border,
				radius: newRadius,
			},
		};

		if ( newRadius === undefined || newRadius === '' ) {
			newStyle = cleanEmptyObject( newStyle );
		}

		setAttributes( { style: newStyle } );
	};

	return (
		<UnitControl
			value={ style?.border?.radius }
			label={ __( 'Border radius' ) }
			min={ MIN_BORDER_RADIUS_VALUE }
			onChange={ onChange }
			onUnitChange={ onUnitChange }
			step={ step }
			units={ CSS_UNITS }
		/>
	);
}
