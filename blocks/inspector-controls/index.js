/**
 * WordPress dependencies
 */
import { Fill } from '@wordpress/components';

export default function InspectorControls( { children } ) {
	return (
		<Fill name="Inspector.Controls">
			{ children }
		</Fill>
	);
}
