/**
 * WordPress dependencies
 */
import { ResizableBox } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockPopover from '../block-popover';

export default function ResizableCoverPopover( {
	clientId,
	__unstableRefreshSize,
	...props
} ) {
	return (
		<BlockPopover
			clientId={ clientId }
			__unstableCoverTarget
			__unstableRefreshSize={ __unstableRefreshSize }
			__unstablePopoverSlot="block-toolbar"
			shift={ false }
		>
			<ResizableBox { ...props } />
		</BlockPopover>
	);
}
