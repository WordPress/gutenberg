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
import { useSetting } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const DEFAULT_VALUES = { px: '100', em: '10', rem: '10', vw: '10', vh: '25' };

function Controls( { attributes, context, setAttributes } ) {
	const { orientation } = context;
	const label = orientation !== 'horizontal' ? __( 'Height' ) : __( 'Width' );

	const { height, width } = attributes;
	const { valueToConvert, valueUnit: unit } =
		getValueAndUnit( orientation !== 'horizontal' ? height : width ) || {};
	const value = Number( valueToConvert );

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
			setNewDimensions( nextValue, unit );
		},
		[ height, width ]
	);

	const handleUnitChange = useCallback(
		( nextUnit ) => {
			setNewDimensions( value, nextUnit );
		},
		[ height, width ]
	);

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'px',
			'em',
			'rem',
			'vw',
			'vh',
		],
		defaultValues: DEFAULT_VALUES,
	} );

	return (
		<>
			<PanelBody title={ __( 'Dimensions' ) }>
				<UnitControl
					label={ label }
					min={ 1 }
					value={ value }
					onChange={ handleChange }
					onUnitChange={ handleUnitChange }
					units={ units }
					unit={ unit }
					style={ styles.rangeCellContainer }
				/>
			</PanelBody>
		</>
	);
}

export default Controls;
