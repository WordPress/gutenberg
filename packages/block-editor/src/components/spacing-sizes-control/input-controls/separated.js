/**
 * Internal dependencies
 */
import SpacingInputControl from './spacing-input-control';
import { ALL_SIDES, LABELS, ICONS } from '../utils';

export default function SeparatedInputControls( {
	minimumCustomValue,
	onChange,
	onMouseOut,
	onMouseOver,
	sides,
	spacingSizes,
	type,
	values,
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
						key={ `spacing-sizes-control-${ side }` }
						icon={ ICONS[ side ] }
						label={ LABELS[ side ] }
						minimumCustomValue={ minimumCustomValue }
						onChange={ createHandleOnChange( side ) }
						onMouseOut={ onMouseOut }
						onMouseOver={ onMouseOver }
						side={ side }
						spacingSizes={ spacingSizes }
						type={ type }
						value={ values[ side ] }
						withInputField={ false }
					/>
				);
			} ) }
		</>
	);
}
