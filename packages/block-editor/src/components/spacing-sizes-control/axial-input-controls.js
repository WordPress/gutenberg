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
	minimumCustomValue,
	onMouseOver,
	onMouseOut,
} ) {
	const createHandleOnChange = ( side ) => ( next ) => {
		if ( ! onChange ) {
			return;
		}
		const nextValues = { ...values };

		if ( side === 'vertical' ) {
			nextValues.top = next;
			nextValues.bottom = next;
		}

		if ( side === 'horizontal' ) {
			nextValues.left = next;
			nextValues.right = next;
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
						key={ `spacing-sizes-control-${ side }` }
						withInputField={ false }
						side={ side }
						spacingSizes={ spacingSizes }
						type={ type }
						minimumCustomValue={ minimumCustomValue }
						onMouseOver={ onMouseOver }
						onMouseOut={ onMouseOut }
					/>
				);
			} ) }
		</>
	);
}
