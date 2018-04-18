/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const Fill = createSlotFill( 'BlockFormatControls' );
const { Slot } = Fill;

const BlockFormatControls = ifBlockEditSelected( Fill );

BlockFormatControls.Slot = Slot;

export default BlockFormatControls;
