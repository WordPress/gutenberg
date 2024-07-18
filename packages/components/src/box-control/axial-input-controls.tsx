/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { parseQuantityAndUnitFromRawValue } from '../unit-control/utils';
import Tooltip from '../tooltip';
import { CUSTOM_VALUE_SETTINGS, LABELS } from './utils';
import {
	FlexedBoxControlIcon,
	FlexedRangeControl,
	InputWrapper,
	StyledUnitControl,
} from './styles/box-control-styles';
import type { BoxControlInputControlProps } from './types';

const groupedSides = [ 'vertical', 'horizontal' ] as const;
type GroupedSide = ( typeof groupedSides )[ number ];

export default function AxialInputControls( {
	__next40pxDefaultSize,
	onChange,
	onFocus,
	values,
	selectedUnits,
	setSelectedUnits,
	sides,
	...props
}: BoxControlInputControlProps ) {
	const generatedId = useInstanceId(
		AxialInputControls,
		`box-control-input`
	);

	const createHandleOnFocus =
		( side: GroupedSide ) =>
		( event: React.FocusEvent< HTMLInputElement > ) => {
			if ( ! onFocus ) {
				return;
			}
			onFocus( event, { side } );
		};

	const handleOnValueChange = ( side: GroupedSide, next?: string ) => {
		if ( ! onChange ) {
			return;
		}
		const nextValues = { ...values };
		const isNumeric = next !== undefined && ! isNaN( parseFloat( next ) );
		const nextValue = isNumeric ? next : undefined;

		if ( side === 'vertical' ) {
			nextValues.top = nextValue;
			nextValues.bottom = nextValue;
		}

		if ( side === 'horizontal' ) {
			nextValues.left = nextValue;
			nextValues.right = nextValue;
		}

		onChange( nextValues );
	};

	const createHandleOnUnitChange =
		( side: GroupedSide ) => ( next?: string ) => {
			const newUnits = { ...selectedUnits };

			if ( side === 'vertical' ) {
				newUnits.top = next;
				newUnits.bottom = next;
			}

			if ( side === 'horizontal' ) {
				newUnits.left = next;
				newUnits.right = next;
			}

			setSelectedUnits( newUnits );
		};

	// Filter sides if custom configuration provided, maintaining default order.
	const filteredSides = sides?.length
		? groupedSides.filter( ( side ) => sides.includes( side ) )
		: groupedSides;

	return (
		<>
			{ filteredSides.map( ( side ) => {
				const [ parsedQuantity, parsedUnit ] =
					parseQuantityAndUnitFromRawValue(
						side === 'vertical' ? values.top : values.left
					);
				const selectedUnit =
					side === 'vertical'
						? selectedUnits.top
						: selectedUnits.left;

				const inputId = [ generatedId, side ].join( '-' );

				return (
					<InputWrapper key={ side }>
						<FlexedBoxControlIcon side={ side } sides={ sides } />
						<Tooltip placement="top-end" text={ LABELS[ side ] }>
							<StyledUnitControl
								{ ...props }
								__next40pxDefaultSize={ __next40pxDefaultSize }
								className="component-box-control__unit-control"
								id={ inputId }
								isPressEnterToChange
								value={ [
									parsedQuantity,
									selectedUnit ?? parsedUnit,
								].join( '' ) }
								onChange={ ( newValue ) =>
									handleOnValueChange( side, newValue )
								}
								onUnitChange={ createHandleOnUnitChange(
									side
								) }
								onFocus={ createHandleOnFocus( side ) }
								label={ LABELS[ side ] }
								hideLabelFromVision
								key={ side }
							/>
						</Tooltip>
						<FlexedRangeControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize={ __next40pxDefaultSize }
							aria-controls={ inputId }
							label={ LABELS[ side ] }
							hideLabelFromVision
							onChange={ ( newValue ) =>
								handleOnValueChange(
									side,
									newValue !== undefined
										? [
												newValue,
												selectedUnit ?? parsedUnit,
										  ].join( '' )
										: undefined
								)
							}
							min={ 0 }
							max={
								CUSTOM_VALUE_SETTINGS[ selectedUnit ?? 'px' ]
									?.max ?? 10
							}
							step={
								CUSTOM_VALUE_SETTINGS[ selectedUnit ?? 'px' ]
									?.step ?? 0.1
							}
							value={ parsedQuantity ?? 0 }
							withInputField={ false }
						/>
					</InputWrapper>
				);
			} ) }
		</>
	);
}
