/**
 * WordPress dependencies
 */
import { Flex } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SpacingRangeControl from './spacing-range-control';
import { ALL_SIDES, LABELS } from './utils';

const noop = () => {};

export default function BoxInputControls( {
	onChange = noop,
	onFocus = noop,
	values,
	selectedUnits,
	setSelectedUnits,
	sides,
	...props
} ) {
	const createHandleOnFocus = ( side ) => ( event ) => {
		onFocus( event, { side } );
	};

	const handleOnChange = ( nextValues ) => {
		onChange( nextValues );
	};

	const createHandleOnChange = ( side ) => ( next ) => {
		// const { altKey } = event;
		const altKey = null;
		const nextValues = { ...values };
		nextValues[ side ] = next;

		/**
		 * Supports changing pair sides. For example, holding the ALT key
		 * when changing the TOP will also update BOTTOM.
		 */
		if ( altKey ) {
			switch ( side ) {
				case 'top':
					nextValues.bottom = next;
					break;
				case 'bottom':
					nextValues.top = next;
					break;
				case 'left':
					nextValues.right = next;
					break;
				case 'right':
					nextValues.left = next;
					break;
			}
		}

		handleOnChange( nextValues );
	};

	// Filter sides if custom configuration provided, maintaining default order.
	const filteredSides = sides?.length
		? ALL_SIDES.filter( ( side ) => sides.includes( side ) )
		: ALL_SIDES;

	const first = filteredSides[ 0 ];
	const last = filteredSides[ filteredSides.length - 1 ];
	const only = first === last && first;

	return (
		<Flex className="component-spacing-sizes-control__input-controls-wrapper">
			<Flex
				gap={ 0 }
				align="top"
				direction="column"
				className="component-spacing-sizes-control__input-controls"
			>
				{ filteredSides.map( ( side ) => {
					// const [ parsedQuantity, parsedUnit ] =
					// 	parseQuantityAndUnitFromRawValue( values[ side ] );

					// const computedUnit = values[ side ]
					// 	? parsedUnit
					// 	: selectedUnits[ side ];

					return (
						<SpacingRangeControl
							{ ...props }
							isFirst={ first === side }
							isLast={ last === side }
							isOnly={ only === side }
							// value={ [ parsedQuantity, computedUnit ].join(
							// 	''
							// ) }
							value={ null }
							onChange={ createHandleOnChange( side ) }
							onFocus={ createHandleOnFocus( side ) }
							label={ LABELS[ side ] }
							key={ `box-control-${ side }` }
							withInputField={ false }
						/>
					);
				} ) }
			</Flex>
		</Flex>
	);
}
