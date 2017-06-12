/**
 * External dependencies
 */
import { Fill } from 'react-slot-fill';

/**
 * Internal dependencies
 */
import './style.scss';

export default function InspectorControls( { children } ) {
	return (
		<Fill name="Inspector.Controls">
			{ children }
		</Fill>
	);
}
