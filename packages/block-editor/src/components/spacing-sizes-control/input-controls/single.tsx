import SpacingInputControl from './spacing-input-control';
import { LABELS, getPresetValueFromCustomValue } from '../utils';
import type { Side, SideValues, SpacingInputControlsProps } from '../types';

export default function SingleInputControl( {
	minimumCustomValue,
	onChange,
	onMouseOut,
	onMouseOver,
	showSideInLabel,
	side,
	spacingSizes,
	type,
	values,
}: SpacingInputControlsProps ) {
	const createHandleOnChange =
		( currentSide: string ) => ( next?: string ) => {
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

			nextValues[ currentSide ] = next;

			onChange( nextValues );
		};

	return (
		<SpacingInputControl
			// The single view is a side.
			label={ LABELS[ side as Side ] }
			minimumCustomValue={ minimumCustomValue }
			onChange={ createHandleOnChange( side as Side ) }
			onMouseOut={ onMouseOut }
			onMouseOver={ onMouseOver }
			showSideInLabel={ showSideInLabel }
			side={ side as Side }
			spacingSizes={ spacingSizes }
			type={ type }
			value={ values[ side as Side ] }
			withInputField={ false }
		/>
	);
}
