import SpacingInputControl from './spacing-input-control';
import {
	LABELS,
	ICONS,
	getPresetValueFromCustomValue,
	hasAxisSupport,
} from '../utils';
import type { SideValues, SpacingInputControlsProps } from '../types';

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
}: SpacingInputControlsProps ) {
	const createHandleOnChange = ( side: string ) => ( next?: string ) => {
		if ( ! onChange ) {
			return;
		}

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
						// The grouped sides are axes.
						icon={ ICONS[ side as keyof typeof ICONS ] }
						label={ LABELS[ side as keyof typeof LABELS ] }
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
