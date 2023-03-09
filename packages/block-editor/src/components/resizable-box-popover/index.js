/**
 * WordPress dependencies
 */
import { ResizableBox } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockPopover from '../block-popover';

export default function ResizableBoxPopover( {
	clientId,
	resizableBoxProps,
	...props
} ) {
	return (
		<BlockPopover
			clientId={ clientId }
			__unstableCoverTarget
			__unstablePopoverSlot="block-toolbar"
			shift={ false }
			{ ...props }
		>
			<ResizableBox { ...resizableBoxProps } />
		</BlockPopover>
	);
}
