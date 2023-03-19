/**
 * WordPress dependencies
 */
import { PanelBody, UnitControl, getValueAndUnit } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSpacerSettings } from './constants';
import styles from './style.scss';

function Controls( {
	attributes,
	context,
	setAttributes,
	presetWidth,
	presetHeight,
} ) {
	const { orientation } = context;
	const label = orientation !== 'horizontal' ? __( 'Height' ) : __( 'Width' );

	const width = presetWidth || attributes.width;
	const height = presetHeight || attributes.height;
	const { valueToConvert, valueUnit: unit } =
		getValueAndUnit( orientation !== 'horizontal' ? height : width ) || {};
	const value = Number( valueToConvert );
	const currentUnit = unit || 'px';

	const setNewDimensions = ( nextValue, nextUnit ) => {
		const valueWithUnit = `${ nextValue }${ nextUnit }`;
		if ( orientation === 'horizontal' ) {
			setAttributes( { width: valueWithUnit } );
		} else {
			setAttributes( { height: valueWithUnit } );
		}
	};

	const handleChange = useCallback(
		( nextValue ) => {
			setNewDimensions( nextValue, currentUnit );
		},
		[ height, width ]
	);

	const handleUnitChange = useCallback(
		( nextUnit ) => {
			setNewDimensions( value, nextUnit );
		},
		[ height, width ]
	);

	const { units, min } = useSpacerSettings( value );

	return (
		<>
			<PanelBody title={ __( 'Dimensions' ) }>
				<UnitControl
					label={ label }
					min={ min }
					value={ value }
					onChange={ handleChange }
					onUnitChange={ handleUnitChange }
					units={ units }
					unit={ currentUnit }
					style={ styles.rangeCellContainer }
				/>
			</PanelBody>
		</>
	);
}

export default Controls;
