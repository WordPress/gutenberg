/**
 * Internal dependencies
 */
import InsertionPoint from './insertion-point';
import BlockPopover from './block-popover';

export default function BlockTools( { children } ) {
	return (
		<InsertionPoint>
			<BlockPopover />
			{ children }
		</InsertionPoint>
	);
}
