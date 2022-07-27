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
} ) {
	// Filter sides if custom configuration provided, maintaining default order.
	const filteredSides = sides?.length
		? ALL_SIDES.filter( ( side ) => sides.includes( side ) )
		: ALL_SIDES;

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
					/>
				);
			} ) }
		</>
	);
}
