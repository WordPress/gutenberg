/**
 * Internal dependencies
 */
import SpacingInputControl from './spacing-input-control';
import { LABELS, ICONS, hasAxisSupport } from '../utils';

const groupedSides = [ 'vertical', 'horizontal' ];

export default function AxialInputControls( {
	minimumCustomValue,
	onChange,
	onMouseOut,
	onMouseOver,
	sides,
	spacingSizes,
	type,
	values,
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
		? groupedSides.filter( ( side ) => hasAxisSupport( sides, side ) )
		: groupedSides;

	return (
		<>
			{ filteredSides.map( ( side ) => {
				const axisValue =
					side === 'vertical' ? values.top : values.left;
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
						value={ axisValue }
						withInputField={ false }
					/>
				);
			} ) }
		</>
	);
}
