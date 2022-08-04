/**
 * Internal dependencies
 */
import SpacingRangeControl from './spacing-range-control';
import { parseQuantityAndUnitFromRawValue } from '../unit-control/utils';
import { ALL_SIDES, LABELS } from './utils';
import { LayoutContainer, Layout } from './styles/box-control-styles';

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
		<LayoutContainer className="component-box-control__input-controls-wrapper">
			<Layout
				gap={ 0 }
				align="top"
				className="component-box-control__input-controls"
			>
				{ filteredSides.map( ( side ) => {
					const [ parsedQuantity, parsedUnit ] =
						parseQuantityAndUnitFromRawValue( values[ side ] );

					const computedUnit = values[ side ]
						? parsedUnit
						: selectedUnits[ side ];

					return (
						<SpacingRangeControl
							{ ...props }
							isFirst={ first === side }
							isLast={ last === side }
							isOnly={ only === side }
							value={ [ parsedQuantity, computedUnit ].join(
								''
							) }
							onChange={ createHandleOnChange( side ) }
							onFocus={ createHandleOnFocus( side ) }
							label={ LABELS[ side ] }
							key={ `box-control-${ side }` }
							withInputField={ false }
						/>
					);
				} ) }
			</Layout>
		</LayoutContainer>
	);
}
