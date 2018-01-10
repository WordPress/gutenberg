/**
 * WordPress dependencies
 */
import { Toolbar, Fill } from '@wordpress/components';

export default function BlockControls( { controls, children } ) {
	return (
		<Fill name="Formatting.Toolbar">
			<Toolbar controls={ controls } />
			{ children }
		</Fill>
	);
}
