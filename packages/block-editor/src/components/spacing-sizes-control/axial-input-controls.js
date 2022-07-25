/**
 * Internal dependencies
 */
import SpacingInputControl from './spacing-input-control';
import { LABELS } from './utils';

const groupedSides = [ 'vertical', 'horizontal' ];

export default function AxialInputControls( {
	onChange,
	values,
	sides,
	spacingSizes,
	type,
} ) {
	const createHandleOnChange = ( side ) => ( next ) => {
		if ( ! onChange ) {
			return;
		}
		const nextValues = { ...values };
		const nextValue = next;

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

	// Filter sides if custom configuration provided, maintaining default order.
	const filteredSides = sides?.length
		? groupedSides.filter( ( side ) => sides.includes( side ) )
		: groupedSides;

	return (
		<>
			{ filteredSides.map( ( side ) => {
				const axisValue =
					side === 'vertical' ? values.top : values.left;
				return (
					<SpacingInputControl
						value={ axisValue }
						onChange={ createHandleOnChange( side ) }
						label={ LABELS[ side ] }
						key={ `box-control-${ side }` }
						withInputField={ false }
						side={ side }
						spacingSizes={ spacingSizes }
						type={ type }
					/>
				);
			} ) }
		</>
	);
}
