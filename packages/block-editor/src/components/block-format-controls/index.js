/**
 * WordPress dependencies
 */
import { createToolbarSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot } = createToolbarSlotFill( 'BlockFormatControls' );

const BlockFormatControls = ifBlockEditSelected( Fill );

BlockFormatControls.Slot = Slot;

export default BlockFormatControls;
