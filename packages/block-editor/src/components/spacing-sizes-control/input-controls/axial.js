/**
 * Internal dependencies
 */
import SpacingInputControl from './spacing-input-control';
import {
	LABELS,
	ICONS,
	getPresetValueFromCustomValue,
	hasAxisSupport,
} from '../utils';

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

		// Encode the existing value into the preset value if the passed in value matches the value of one of the spacingSizes.
		const nextValues = {
			...Object.keys( values ).reduce( ( acc, key ) => {
				acc[ key ] = getPresetValueFromCustomValue(
					values[ key ],
					spacingSizes
				);
				return acc;
			}, {} ),
		};

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
