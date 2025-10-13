/**
 * WordPress dependencies
 */
import {
	BaseControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import LinkedButton from './linked-button';
import { useSettings } from '../use-settings';
import { hasDefinedValues, hasMixedValues } from './utils';
import SingleInputControl from './single-input-control';
import {
	DEFAULT_VALUES,
	RANGE_CONTROL_MAX_SIZE,
	EMPTY_ARRAY,
} from './constants';

function useBorderRadiusSizes( presets ) {
	const defaultSizes = presets?.default ?? EMPTY_ARRAY;
	const customSizes = presets?.custom ?? EMPTY_ARRAY;
	const themeSizes = presets?.theme ?? EMPTY_ARRAY;

	return useMemo( () => {
		const sizes = [
			{ name: __( 'None' ), slug: '0', size: 0 },
			...customSizes,
			...themeSizes,
			...defaultSizes,
		];

		return sizes.length > RANGE_CONTROL_MAX_SIZE
			? [
					{
						name: __( 'Default' ),
						slug: 'default',
						size: undefined,
					},
					...sizes,
			  ]
			: sizes;
	}, [ customSizes, themeSizes, defaultSizes ] );
}

/**
 * Control to display border radius options.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onChange Callback to handle onChange.
 * @param {Object}   props.values   Border radius values.
 * @param {Object}   props.presets  Border radius presets.
 *
 * @return {Element}              Custom border radius control.
 */
export default function BorderRadiusControl( { onChange, values, presets } ) {
	const [ isLinked, setIsLinked ] = useState(
		! hasDefinedValues( values ) || ! hasMixedValues( values )
	);
	const options = useBorderRadiusSizes( presets );
	// Tracking selected units via internal state allows filtering of CSS unit
	// only values from being saved while maintaining preexisting unit selection
	// behaviour. Filtering CSS unit only values prevents invalid style values.
	const [ selectedUnits, setSelectedUnits ] = useState( {
		flat:
			typeof values === 'string'
				? parseQuantityAndUnitFromRawValue( values )[ 1 ]
				: undefined,
		topLeft: parseQuantityAndUnitFromRawValue( values?.topLeft )[ 1 ],
		topRight: parseQuantityAndUnitFromRawValue( values?.topRight )[ 1 ],
		bottomLeft: parseQuantityAndUnitFromRawValue( values?.bottomLeft )[ 1 ],
		bottomRight: parseQuantityAndUnitFromRawValue(
			values?.bottomRight
		)[ 1 ],
	} );

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ 'px', 'em', 'rem' ],
	} );

	const toggleLinked = () => setIsLinked( ! isLinked );

	return (
		<fieldset className="components-border-radius-control">
			<HStack className="components-border-radius-control__header">
				<BaseControl.VisualLabel as="legend">
					{ __( 'Radius' ) }
				</BaseControl.VisualLabel>
				<LinkedButton onClick={ toggleLinked } isLinked={ isLinked } />
			</HStack>
			{ isLinked ? (
				<>
					<SingleInputControl
						onChange={ onChange }
						selectedUnits={ selectedUnits }
						setSelectedUnits={ setSelectedUnits }
						values={ values }
						units={ units }
						corner="all"
						presets={ options }
					/>
				</>
			) : (
				<VStack>
					{ [
						'topLeft',
						'topRight',
						'bottomLeft',
						'bottomRight',
					].map( ( corner ) => (
						<SingleInputControl
							key={ corner }
							onChange={ onChange }
							selectedUnits={ selectedUnits }
							setSelectedUnits={ setSelectedUnits }
							values={ values || DEFAULT_VALUES }
							units={ units }
							corner={ corner }
							presets={ options }
						/>
					) ) }
				</VStack>
			) }
		</fieldset>
	);
}
