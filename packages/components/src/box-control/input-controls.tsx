/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import { parseQuantityAndUnitFromRawValue } from '../unit-control/utils';
import { ALL_SIDES, CUSTOM_VALUE_SETTINGS, LABELS } from './utils';
import {
	FlexedBoxControlIcon,
	FlexedRangeControl,
} from './styles/box-control-styles';
import { HStack } from '../h-stack';
import { VStack } from '../v-stack';
import type { BoxControlInputControlProps, BoxControlValue } from './types';
import type { UnitControlProps } from '../unit-control/types';

const noop = () => {};

export default function BoxInputControls( {
	onChange = noop,
	onFocus = noop,
	onHoverOn = noop,
	onHoverOff = noop,
	values,
	selectedUnits,
	setSelectedUnits,
	sides,
	...props
}: BoxControlInputControlProps ) {
	const createHandleOnFocus =
		( side: keyof BoxControlValue ) =>
		( event: React.FocusEvent< HTMLInputElement > ) => {
			onFocus( event, { side } );
		};

	const createHandleOnHoverOn = ( side: keyof BoxControlValue ) => () => {
		onHoverOn( { [ side ]: true } );
	};

	const createHandleOnHoverOff = ( side: keyof BoxControlValue ) => () => {
		onHoverOff( { [ side ]: false } );
	};

	const handleOnChange = ( nextValues: BoxControlValue ) => {
		onChange( nextValues );
	};

	const sliderOnChange = ( side: keyof BoxControlValue, next: string ) => {
		const nextValues = { ...values };
		nextValues[ side ] = next;
		handleOnChange( nextValues );
	};

	const createHandleOnChange: (
		side: keyof BoxControlValue
	) => UnitControlProps[ 'onChange' ] =
		( side ) =>
		( next, { event } ) => {
			const nextValues = { ...values };
			const isNumeric =
				next !== undefined && ! isNaN( parseFloat( next ) );
			const nextValue = isNumeric ? next : undefined;

			nextValues[ side ] = nextValue;

			/**
			 * Supports changing pair sides. For example, holding the ALT key
			 * when changing the TOP will also update BOTTOM.
			 */
			// @ts-expect-error - TODO: event.altKey is only present when the change event was
			// triggered by a keyboard event. Should this feature be implemented differently so
			// it also works with drag events?
			if ( event.altKey ) {
				switch ( side ) {
					case 'top':
						nextValues.bottom = nextValue;
						break;
					case 'bottom':
						nextValues.top = nextValue;
						break;
					case 'left':
						nextValues.right = nextValue;
						break;
					case 'right':
						nextValues.left = nextValue;
						break;
				}
			}

			handleOnChange( nextValues );
		};

	const createHandleOnUnitChange =
		( side: keyof BoxControlValue ) => ( next?: string ) => {
			const newUnits = { ...selectedUnits };
			newUnits[ side ] = next;
			setSelectedUnits( newUnits );
		};

	// Filter sides if custom configuration provided, maintaining default order.
	const filteredSides = sides?.length
		? ALL_SIDES.filter( ( side ) => sides.includes( side ) )
		: ALL_SIDES;

	const first = filteredSides[ 0 ];
	const last = filteredSides[ filteredSides.length - 1 ];
	const only = first === last && first;

	return (
		<VStack className="component-box-control__input-controls">
			{ filteredSides.map( ( side ) => {
				const [ parsedQuantity, parsedUnit ] =
					parseQuantityAndUnitFromRawValue( values[ side ] );

				const computedUnit = values[ side ]
					? parsedUnit
					: selectedUnits[ side ];

				return (
					<HStack key={ `box-control-${ side }` } expanded>
						<FlexedBoxControlIcon side={ side } sides={ sides } />
						<UnitControl
							{ ...props }
							isFirst={ first === side }
							isLast={ last === side }
							isOnly={ only === side }
							value={ [ parsedQuantity, computedUnit ].join(
								''
							) }
							onChange={ createHandleOnChange( side ) }
							onUnitChange={ createHandleOnUnitChange( side ) }
							onFocus={ createHandleOnFocus( side ) }
							onHoverOn={ createHandleOnHoverOn( side ) }
							onHoverOff={ createHandleOnHoverOff( side ) }
							label={ LABELS[ side ] }
						/>

						<FlexedRangeControl
							__nextHasNoMarginBottom
							hideLabelFromVision
							initialPosition={ parsedQuantity ?? 0 }
							label={ LABELS[ side ] }
							onChange={ ( newValue ) => {
								sliderOnChange(
									side,
									[ newValue, computedUnit ].join( '' )
								);
							} }
							min={ 0 }
							max={
								CUSTOM_VALUE_SETTINGS[ computedUnit ?? 'px' ]
									?.max ?? 10
							}
							step={
								CUSTOM_VALUE_SETTINGS[ computedUnit ?? 'px' ]
									?.steps ?? 0.1
							}
							value={ parsedQuantity }
							withInputField={ false }
						/>
					</HStack>
				);
			} ) }
		</VStack>
	);
}
