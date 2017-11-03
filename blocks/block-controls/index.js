/**
 * External dependencies
 */
import { Fill } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { Toolbar } from '@wordpress/components';

export default function BlockControls( { controls, children } ) {
	return (
		<Fill name="Formatting.Toolbar">
			<Toolbar controls={ controls } />
			{ children }
		</Fill>
	);
}
