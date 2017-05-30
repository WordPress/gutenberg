/**
 * External dependencies
 */
import { Fill } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { Toolbar } from 'components';

export default function BlockControls( { controls } ) {
	return (
		<Fill name="Formatting.Toolbar">
			<Toolbar controls={ controls } />
		</Fill>
	);
}
