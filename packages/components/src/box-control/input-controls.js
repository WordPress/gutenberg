/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import { parseQuantityAndUnitFromRawValue } from '../unit-control/utils';
import { ALL_SIDES, LABELS } from './utils';
import { LayoutContainer, Layout } from './styles/box-control-styles';

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
} ) {
	const createHandleOnFocus = ( side ) => ( event ) => {
		onFocus( event, { side } );
	};

	const createHandleOnHoverOn = ( side ) => () => {
		onHoverOn( { [ side ]: true } );
	};

	const createHandleOnHoverOff = ( side ) => () => {
		onHoverOff( { [ side ]: false } );
	};

	const handleOnChange = ( nextValues ) => {
		onChange( nextValues );
	};

	const createHandleOnChange = ( side ) => ( next, { event } ) => {
		const { altKey } = event;
		const nextValues = { ...values };
		const isNumeric = ! isNaN( parseFloat( next ) );
		const nextValue = isNumeric ? next : undefined;

		nextValues[ side ] = nextValue;

		/**
		 * Supports changing pair sides. For example, holding the ALT key
		 * when changing the TOP will also update BOTTOM.
		 */
		if ( altKey ) {
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

	const createHandleOnUnitChange = ( side ) => ( next ) => {
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
		<LayoutContainer className="component-box-control__input-controls-wrapper">
			<Layout
				gap={ 0 }
				align="top"
				className="component-box-control__input-controls"
			>
				{ filteredSides.map( ( side ) => {
					const [
						parsedQuantity,
						parsedUnit,
					] = parseQuantityAndUnitFromRawValue( values[ side ] );

					const computedUnit = values[ side ]
						? parsedUnit
						: selectedUnits[ side ];

					return (
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
							key={ `box-control-${ side }` }
						/>
					);
				} ) }
			</Layout>
		</LayoutContainer>
	);
}
