/**
 * WordPress dependencies
 */
import { createSlotFill, Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const Fill = createSlotFill( 'BlockControls' );
const { Slot } = Fill;

const BlockControlsFill = ( { controls, children } ) => (
	<Fill>
		<Toolbar controls={ controls } />
		{ children }
	</Fill>
);

const BlockControls = ifBlockEditSelected( BlockControlsFill );

BlockControls.Slot = Slot;

export default BlockControls;
