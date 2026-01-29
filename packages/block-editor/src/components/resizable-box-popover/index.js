/**
 * WordPress dependencies
 */
import { ResizableBox } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockPopoverCover from '../block-popover/cover';

export default function ResizableBoxPopover( {
	clientId,
	resizableBoxProps,
	...props
} ) {
	return (
		<BlockPopoverCover
			clientId={ clientId }
			__unstablePopoverSlot="block-toolbar"
			{ ...props }
		>
			<ResizableBox { ...resizableBoxProps } />
		</BlockPopoverCover>
	);
}
