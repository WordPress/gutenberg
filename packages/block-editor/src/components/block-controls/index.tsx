import BlockControlsFill from './fill';
import BlockControlsSlot from './slot';
import type { BlockControlsFillProps, BlockControlsSlotProps } from './types';

// TypeScript only types a property set on a function declared in this file.
const BlockControls = BlockControlsFill as typeof BlockControlsFill & {
	Slot: typeof BlockControlsSlot;
};

BlockControls.Slot = BlockControlsSlot;

// This is just here for backward compatibility.
export const BlockFormatControls = ( props: BlockControlsFillProps ) => {
	return <BlockControlsFill group="inline" { ...props } />;
};
BlockFormatControls.Slot = function Slot( props: BlockControlsSlotProps ) {
	return <BlockControlsSlot group="inline" { ...props } />;
};

export default BlockControls;
