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

const MIN_BORDER_WIDTH = 0;

/**
 * Inspector control for configuring border width property.
 *
 * @param  {Object} props  Block properties.
 * @return {WPElement}     Border width edit element.
 */
export const BorderWidthEdit = ( props ) => {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	// Step value is maintained in state so step is appropriate for current unit
	// even when current radius value is undefined.
	const initialStep = parseUnit( style?.border?.width ) === 'px' ? 1 : 0.25;
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

		if ( newWidth === undefined ) {
			newStyle = cleanEmptyObject( newStyle );
		}

		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	};

	return (
		<UnitControl
			value={ style?.border?.width }
			label={ __( 'Border width' ) }
			min={ MIN_BORDER_WIDTH }
			onChange={ onChange }
			onUnitChange={ onUnitChange }
			step={ step }
			units={ CSS_UNITS }
		/>
	);
};
