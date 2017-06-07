/**
 * External dependencies
 */
import { Fill } from 'react-slot-fill';

export default function InspectorControls( { children } ) {
	return (
		<Fill name="Inspector.Controls">
			{ children }
		</Fill>
	);
}
