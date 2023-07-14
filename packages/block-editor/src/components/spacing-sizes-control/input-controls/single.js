/**
 * Internal dependencies
 */
import SpacingInputControl from './spacing-input-control';
import { LABELS } from '../utils';

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
} ) {
	const createHandleOnChange = ( currentSide ) => ( next ) => {
		const nextValues = { ...values };
		nextValues[ currentSide ] = next;

		onChange( nextValues );
	};

	return (
		<SpacingInputControl
			label={ LABELS[ side ] }
			minimumCustomValue={ minimumCustomValue }
			onChange={ createHandleOnChange( side ) }
			onMouseOut={ onMouseOut }
			onMouseOver={ onMouseOver }
			showSideInLabel={ showSideInLabel }
			side={ side }
			spacingSizes={ spacingSizes }
			type={ type }
			value={ values[ side ] }
			withInputField={ false }
		/>
	);
}
