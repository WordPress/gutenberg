/**
 * Internal dependencies
 */
import BlockControlsFill from './fill';
import BlockControlsSlot from './slot';

const BlockControls = BlockControlsFill;

BlockControls.Slot = BlockControlsSlot;

// This is just here for backward compatibility.
export const BlockFormatControls = ( props ) => {
	return <BlockControlsFill group="inline" { ...props } />;
};
BlockFormatControls.Slot = ( props ) => {
	return <BlockControlsSlot group="inline" { ...props } />;
};

export default BlockControls;
