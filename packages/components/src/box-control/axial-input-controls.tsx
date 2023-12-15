/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { parseQuantityAndUnitFromRawValue } from '../unit-control/utils';
import UnitControl from './unit-control';
import { CUSTOM_VALUE_SETTINGS, LABELS } from './utils';
import {
	FlexedBoxControlIcon,
	FlexedRangeControl,
	InputWrapper,
} from './styles/box-control-styles';
import type { BoxControlInputControlProps } from './types';

const groupedSides = [ 'vertical', 'horizontal' ] as const;
type GroupedSide = ( typeof groupedSides )[ number ];

export default function AxialInputControls( {
	onChange,
	onFocus,
	onHoverOn,
	onHoverOff,
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

	const createHandleOnHoverOn = ( side: GroupedSide ) => () => {
		if ( ! onHoverOn ) {
			return;
		}
		if ( side === 'vertical' ) {
			onHoverOn( {
				top: true,
				bottom: true,
			} );
		}
		if ( side === 'horizontal' ) {
			onHoverOn( {
				left: true,
				right: true,
			} );
		}
	};

	const createHandleOnHoverOff = ( side: GroupedSide ) => () => {
		if ( ! onHoverOff ) {
			return;
		}
		if ( side === 'vertical' ) {
			onHoverOff( {
				top: false,
				bottom: false,
			} );
		}
		if ( side === 'horizontal' ) {
			onHoverOff( {
				left: false,
				right: false,
			} );
		}
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

	const first = filteredSides[ 0 ];
	const last = filteredSides[ filteredSides.length - 1 ];
	const only = first === last && first;

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
					<InputWrapper key={ `box-control-${ side }` }>
						<FlexedBoxControlIcon side={ side } sides={ sides } />
						<UnitControl
							{ ...props }
							id={ inputId }
							isFirst={ first === side }
							isLast={ last === side }
							isOnly={ only === side }
							value={ [
								parsedQuantity,
								selectedUnit ?? parsedUnit,
							].join( '' ) }
							onChange={ ( newValue ) =>
								handleOnValueChange( side, newValue )
							}
							onUnitChange={ createHandleOnUnitChange( side ) }
							onFocus={ createHandleOnFocus( side ) }
							onHoverOn={ createHandleOnHoverOn( side ) }
							onHoverOff={ createHandleOnHoverOff( side ) }
							label={ LABELS[ side ] }
							key={ side }
						/>
						<FlexedRangeControl
							__nextHasNoMarginBottom
							aria-controls={ inputId }
							aria-labelledby={ inputId }
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
									?.steps ?? 0.1
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
