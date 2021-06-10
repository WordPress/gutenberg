/**
 * WordPress dependencies
 */
import {
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
	parseUnit,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';
import useSetting from '../components/use-setting';

const MIN_BORDER_WIDTH = 0;

/**
 * Inspector control for configuring border width property.
 *
 * @param {Object} props Block properties.
 *
 * @return {WPElement} Border width edit element.
 */
export const BorderWidthEdit = ( props ) => {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	// Step value is maintained in state so step is appropriate for current unit
	// even when current radius value is undefined.
	const initialStep =
		parseUnit( style?.border?.width )[ 1 ] === 'px' ? 1 : 0.25;
	const [ step, setStep ] = useState( initialStep );

	const onUnitChange = ( newUnit ) => {
		setStep( newUnit === 'px' ? 1 : 0.25 );
	};

	const onChange = ( newWidth ) => {
		let newStyle = {
			...style,
			border: {
				...style?.border,
				width: newWidth,
			},
		};

		if ( newWidth === undefined || newWidth === '' ) {
			newStyle = cleanEmptyObject( newStyle );
		}

		setAttributes( { style: newStyle } );
	};

	const units = useCustomUnits( {
		availableUnits: useSetting( 'layout.units' ) || [ 'px', 'em', 'rem' ],
	} );

	return (
		<UnitControl
			value={ style?.border?.width }
			label={ __( 'Border width' ) }
			min={ MIN_BORDER_WIDTH }
			onChange={ onChange }
			onUnitChange={ onUnitChange }
			step={ step }
			units={ units }
		/>
	);
};
