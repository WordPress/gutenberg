/**
 * WordPress dependencies
 */
import {
	PanelBody,
	UnitControl,
	getValueAndUnit,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { useSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { MIN_SPACER_SIZE } from './constants';
import styles from './style.scss';

export const DEFAULT_VALUES = { px: 100, em: 10, rem: 10, vw: 10, vh: 25 };

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

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ 'px', 'em', 'rem', 'vw', 'vh' ],
		defaultValues: DEFAULT_VALUES,
	} );

	return (
		<>
			<PanelBody title={ __( 'Dimensions' ) }>
				<UnitControl
					label={ label }
					min={ MIN_SPACER_SIZE }
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
