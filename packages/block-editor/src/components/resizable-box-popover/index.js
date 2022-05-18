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
		>
			<ResizableBox { ...props } />
		</BlockPopover>
	);
}
