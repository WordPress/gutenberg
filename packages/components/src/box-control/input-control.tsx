/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { settings } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';
import { parseQuantityAndUnitFromRawValue } from '../unit-control/utils';
import {
	CUSTOM_VALUE_SETTINGS,
	getMergedValue,
	getAllowedSides,
	getPresetIndexFromValue,
	getPresetValueFromIndex,
	isValuePreset,
	isValuesDefined,
	isValueMixed,
	LABELS,
} from './utils';
import {
	FlexedBoxControlIcon,
	FlexedRangeControl,
	InputWrapper,
	StyledUnitControl,
} from './styles/box-control-styles';
import type { BoxControlInputControlProps, BoxControlValue } from './types';
import Button from '../button';

const noop = () => {};

function getSidesToModify(
	side: BoxControlInputControlProps[ 'side' ],
	sides: BoxControlInputControlProps[ 'sides' ],
	isAlt?: boolean
) {
	const allowedSides = getAllowedSides( sides );

	let modifiedSides: ( keyof BoxControlValue )[] = [];
	switch ( side ) {
		case 'all':
			modifiedSides = [ 'top', 'bottom', 'left', 'right' ];
			break;
		case 'horizontal':
			modifiedSides = [ 'left', 'right' ];
			break;
		case 'vertical':
			modifiedSides = [ 'top', 'bottom' ];
			break;
		default:
			modifiedSides = [ side ];
	}

	if ( isAlt ) {
		switch ( side ) {
			case 'top':
				modifiedSides.push( 'bottom' );
				break;
			case 'bottom':
				modifiedSides.push( 'top' );
				break;
			case 'left':
				modifiedSides.push( 'left' );
				break;
			case 'right':
				modifiedSides.push( 'right' );
				break;
		}
	}

	return modifiedSides.filter( ( s ) => allowedSides.has( s ) );
}

export default function BoxInputControl( {
	__next40pxDefaultSize,
	onChange = noop,
	onFocus = noop,
	values,
	selectedUnits,
	setSelectedUnits,
	sides,
	side,
	min = 0,
	presets,
	presetKey,
	...props
}: BoxControlInputControlProps ) {
	const defaultValuesToModify = getSidesToModify( side, sides );

	const handleOnFocus = ( event: React.FocusEvent< HTMLInputElement > ) => {
		onFocus( event, { side } );
	};

	const handleOnChange = ( nextValues: BoxControlValue ) => {
		onChange( nextValues );
	};

	const handleRawOnValueChange = ( next?: string ) => {
		const nextValues = { ...values };
		defaultValuesToModify.forEach( ( modifiedSide ) => {
			nextValues[ modifiedSide ] = next;
		} );

		handleOnChange( nextValues );
	};

	const handleOnValueChange = (
		next?: string,
		extra?: { event: React.SyntheticEvent< Element, Event > }
	) => {
		const nextValues = { ...values };
		const isNumeric = next !== undefined && ! isNaN( parseFloat( next ) );
		const nextValue = isNumeric ? next : undefined;
		const modifiedSides = getSidesToModify(
			side,
			sides,
			/**
			 * Supports changing pair sides. For example, holding the ALT key
			 * when changing the TOP will also update BOTTOM.
			 */
			// @ts-expect-error - TODO: event.altKey is only present when the change event was
			// triggered by a keyboard event. Should this feature be implemented differently so
			// it also works with drag events?
			!! extra?.event.altKey
		);

		modifiedSides.forEach( ( modifiedSide ) => {
			nextValues[ modifiedSide ] = nextValue;
		} );

		handleOnChange( nextValues );
	};

	const handleOnUnitChange = ( next?: string ) => {
		const newUnits = { ...selectedUnits };
		defaultValuesToModify.forEach( ( modifiedSide ) => {
			newUnits[ modifiedSide ] = next;
		} );
		setSelectedUnits( newUnits );
	};

	const mergedValue = getMergedValue( values, defaultValuesToModify );
	const hasValues = isValuesDefined( values );
	const isMixed =
		hasValues &&
		defaultValuesToModify.length > 1 &&
		isValueMixed( values, defaultValuesToModify );
	const [ parsedQuantity, parsedUnit ] =
		parseQuantityAndUnitFromRawValue( mergedValue );
	const computedUnit = hasValues
		? parsedUnit
		: selectedUnits[ defaultValuesToModify[ 0 ] ];
	const generatedId = useInstanceId( BoxInputControl, 'box-control-input' );
	const inputId = [ generatedId, side ].join( '-' );
	const isMixedUnit =
		defaultValuesToModify.length > 1 &&
		mergedValue === undefined &&
		defaultValuesToModify.some(
			( s ) => selectedUnits[ s ] !== computedUnit
		);
	const usedValue =
		mergedValue === undefined && computedUnit ? computedUnit : mergedValue;
	const mixedPlaceholder = isMixed || isMixedUnit ? __( 'Mixed' ) : undefined;
	const hasPresets = presets && presets.length > 0 && presetKey;
	const hasPresetValue =
		hasPresets &&
		mergedValue !== undefined &&
		! isMixed &&
		isValuePreset( mergedValue, presetKey );
	const [ showCustomValueControl, setShowCustomValueControl ] = useState(
		! hasPresets ||
			( ! hasPresetValue && ! isMixed && mergedValue !== undefined )
	);
	const presetIndex = hasPresetValue
		? getPresetIndexFromValue( mergedValue, presetKey, presets )
		: undefined;
	const marks: Array< {
		value: number;
		label: string;
		tooltip: string;
	} > = hasPresets
		? [
				{
					value: 0,
					label: '',
					tooltip: __( 'None' ),
				},
				...presets.map( ( preset, index ) => ( {
					value: index + 1,
					label: '',
					tooltip: preset.name ?? preset.slug,
				} ) ),
		  ]
		: [];

	return (
		<InputWrapper key={ `box-control-${ side }` } expanded>
			<FlexedBoxControlIcon side={ side } sides={ sides } />
			{ showCustomValueControl && (
				<>
					<Tooltip placement="top-end" text={ LABELS[ side ] }>
						<StyledUnitControl
							{ ...props }
							min={ min }
							__shouldNotWarnDeprecated36pxSize
							__next40pxDefaultSize={ __next40pxDefaultSize }
							className="component-box-control__unit-control"
							id={ inputId }
							isPressEnterToChange
							disableUnits={ isMixed || isMixedUnit }
							value={ usedValue }
							onChange={ handleOnValueChange }
							onUnitChange={ handleOnUnitChange }
							onFocus={ handleOnFocus }
							label={ LABELS[ side ] }
							placeholder={ mixedPlaceholder }
							hideLabelFromVision
						/>
					</Tooltip>

					<FlexedRangeControl
						__next40pxDefaultSize={ __next40pxDefaultSize }
						__shouldNotWarnDeprecated36pxSize
						aria-controls={ inputId }
						label={ LABELS[ side ] }
						hideLabelFromVision
						onChange={ ( newValue ) => {
							handleOnValueChange(
								newValue !== undefined
									? [ newValue, computedUnit ].join( '' )
									: undefined
							);
						} }
						min={ isFinite( min ) ? min : 0 }
						max={
							CUSTOM_VALUE_SETTINGS[ computedUnit ?? 'px' ]
								?.max ?? 10
						}
						step={
							CUSTOM_VALUE_SETTINGS[ computedUnit ?? 'px' ]
								?.step ?? 0.1
						}
						value={ parsedQuantity ?? 0 }
						withInputField={ false }
					/>
				</>
			) }

			{ hasPresets && ! showCustomValueControl && (
				<FlexedRangeControl
					__next40pxDefaultSize
					className="spacing-sizes-control__range-control"
					value={ presetIndex !== undefined ? presetIndex + 1 : 0 }
					onChange={ ( newIndex ) => {
						const newValue =
							newIndex === 0 || newIndex === undefined
								? undefined
								: getPresetValueFromIndex(
										newIndex - 1,
										presetKey,
										presets
								  );
						handleRawOnValueChange( newValue );
					} }
					withInputField={ false }
					aria-valuenow={
						presetIndex !== undefined ? presetIndex + 1 : 0
					}
					aria-valuetext={
						marks[ presetIndex !== undefined ? presetIndex + 1 : 0 ]
							.tooltip
					}
					renderTooltipContent={ ( index ) =>
						marks[ ! index ? 0 : index ].tooltip
					}
					min={ 0 }
					max={ marks.length - 1 }
					marks={ marks }
					label={ LABELS[ side ] }
					hideLabelFromVision
				/>
			) }

			{ hasPresets && (
				<Button
					label={
						showCustomValueControl
							? __( 'Use size preset' )
							: __( 'Set custom size' )
					}
					icon={ settings }
					onClick={ () => {
						setShowCustomValueControl( ! showCustomValueControl );
					} }
					isPressed={ showCustomValueControl }
					size="small"
					iconSize={ 24 }
				/>
			) }
		</InputWrapper>
	);
}
