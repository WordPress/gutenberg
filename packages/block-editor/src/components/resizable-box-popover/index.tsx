import { ResizableBox } from '@wordpress/components';
import BlockPopoverCover from '../block-popover/cover';
import type { ResizableBoxPopoverProps } from './types';

export default function ResizableBoxPopover( {
	clientId,
	resizableBoxProps,
	...props
}: ResizableBoxPopoverProps ) {
	return (
		<BlockPopoverCover
			clientId={ clientId }
			__unstablePopoverSlot="__unstable-block-tools-after"
			{ ...props }
		>
			<ResizableBox { ...resizableBoxProps } />
		</BlockPopoverCover>
	);
}
