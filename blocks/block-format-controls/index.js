/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifEditBlockSelected } from '../block-edit/context';

const Fill = createSlotFill( 'BlockFormatControls' );
const { Slot } = Fill;

const BlockFormatControls = ifEditBlockSelected( Fill );

BlockFormatControls.Slot = Slot;

export default BlockFormatControls;
