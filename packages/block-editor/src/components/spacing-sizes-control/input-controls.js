/**
 * Internal dependencies
 */
import SpacingInputControl from './spacing-input-control';
import { ALL_SIDES, LABELS } from './utils';

export default function BoxInputControls( {
	values,
	sides,
	onChange,
	spacingSizes,
	type,
	minimumCustomValue,
	onMouseOver,
	onMouseOut,
} ) {
	// Filter sides if custom configuration provided, maintaining default order.
	const filteredSides = sides?.length
		? ALL_SIDES.filter( ( side ) => sides.includes( side ) )
		: ALL_SIDES;

	const createHandleOnChange = ( side ) => ( next ) => {
		const nextValues = { ...values };
		nextValues[ side ] = next;

		onChange( nextValues );
	};

	return (
		<>
			{ filteredSides.map( ( side ) => {
				return (
					<SpacingInputControl
						value={ values[ side ] }
						label={ LABELS[ side ] }
						key={ `spacing-sizes-control-${ side }` }
						withInputField={ false }
						side={ side }
						onChange={ createHandleOnChange( side ) }
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
