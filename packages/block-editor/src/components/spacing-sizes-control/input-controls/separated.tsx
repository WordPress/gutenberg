import SpacingInputControl from './spacing-input-control';
import {
	ALL_SIDES,
	LABELS,
	ICONS,
	getPresetValueFromCustomValue,
} from '../utils';
import type { Side, SideValues, SpacingInputControlsProps } from '../types';

export default function SeparatedInputControls( {
	minimumCustomValue,
	onChange,
	onMouseOut,
	onMouseOver,
	sides,
	spacingSizes,
	type,
	values,
}: SpacingInputControlsProps ) {
	// Filter sides if custom configuration provided, maintaining default order.
	const filteredSides = sides?.length
		? ALL_SIDES.filter( ( side ) => sides.includes( side ) )
		: ALL_SIDES;

	const createHandleOnChange = ( side: Side ) => ( next?: string ) => {
		// Encode the existing value into the preset value if the passed in value matches the value of one of the spacingSizes.
		const nextValues = {
			...Object.keys( values ).reduce<
				Record< string, string | undefined >
			>( ( acc, key ) => {
				acc[ key ] = getPresetValueFromCustomValue(
					// The keys come from the side values.
					values[ key as keyof SideValues ],
					spacingSizes
				);
				return acc;
			}, {} ),
		};

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
