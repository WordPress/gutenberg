/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';
import { parseQuantityAndUnitFromRawValue } from '../unit-control/utils';
import { ALL_SIDES, CUSTOM_VALUE_SETTINGS, LABELS } from './utils';
import {
	FlexedBoxControlIcon,
	FlexedRangeControl,
	InputWrapper,
	StyledUnitControl,
} from './styles/box-control-styles';
import type { BoxControlInputControlProps, BoxControlValue } from './types';

const noop = () => {};

export default function BoxInputControls( {
	__next40pxDefaultSize,
	onChange = noop,
	onFocus = noop,
	values,
	selectedUnits,
	setSelectedUnits,
	sides,
	...props
}: BoxControlInputControlProps ) {
	const generatedId = useInstanceId( BoxInputControls, 'box-control-input' );

	const createHandleOnFocus =
		( side: keyof BoxControlValue ) =>
		( event: React.FocusEvent< HTMLInputElement > ) => {
			onFocus( event, { side } );
		};

	const handleOnChange = ( nextValues: BoxControlValue ) => {
		onChange( nextValues );
	};

	const handleOnValueChange = (
		side: keyof BoxControlValue,
		next?: string,
		extra?: { event: React.SyntheticEvent< Element, Event > }
	) => {
		const nextValues = { ...values };
		const isNumeric = next !== undefined && ! isNaN( parseFloat( next ) );
		const nextValue = isNumeric ? next : undefined;

		nextValues[ side ] = nextValue;

		/**
		 * Supports changing pair sides. For example, holding the ALT key
		 * when changing the TOP will also update BOTTOM.
		 */
		// @ts-expect-error - TODO: event.altKey is only present when the change event was
		// triggered by a keyboard event. Should this feature be implemented differently so
		// it also works with drag events?
		if ( extra?.event.altKey ) {
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

	return (
		<>
			{ filteredSides.map( ( side ) => {
				const [ parsedQuantity, parsedUnit ] =
					parseQuantityAndUnitFromRawValue( values[ side ] );

				const computedUnit = values[ side ]
					? parsedUnit
					: selectedUnits[ side ];

				const inputId = [ generatedId, side ].join( '-' );

				return (
					<InputWrapper key={ `box-control-${ side }` } expanded>
						<FlexedBoxControlIcon side={ side } sides={ sides } />
						<Tooltip placement="top-end" text={ LABELS[ side ] }>
							<StyledUnitControl
								{ ...props }
								__next40pxDefaultSize={ __next40pxDefaultSize }
								className="component-box-control__unit-control"
								id={ inputId }
								isPressEnterToChange
								value={ [ parsedQuantity, computedUnit ].join(
									''
								) }
								onChange={ ( nextValue, extra ) =>
									handleOnValueChange(
										side,
										nextValue,
										extra
									)
								}
								onUnitChange={ createHandleOnUnitChange(
									side
								) }
								onFocus={ createHandleOnFocus( side ) }
								label={ LABELS[ side ] }
								hideLabelFromVision
							/>
						</Tooltip>

						<FlexedRangeControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize={ __next40pxDefaultSize }
							aria-controls={ inputId }
							label={ LABELS[ side ] }
							hideLabelFromVision
							onChange={ ( newValue ) => {
								handleOnValueChange(
									side,
									newValue !== undefined
										? [ newValue, computedUnit ].join( '' )
										: undefined
								);
							} }
							min={ 0 }
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
					</InputWrapper>
				);
			} ) }
		</>
	);
}
