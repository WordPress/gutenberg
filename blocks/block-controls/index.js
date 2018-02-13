/**
 * WordPress dependencies
 */
import { Toolbar, Fill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifEditBlockSelected } from '../block-edit/context';

export function BlockControls( { controls, children } ) {
	return (
		<Fill name="Block.Toolbar">
			<Toolbar controls={ controls } />
			{ children }
		</Fill>
	);
}

export default ifEditBlockSelected( BlockControls );
