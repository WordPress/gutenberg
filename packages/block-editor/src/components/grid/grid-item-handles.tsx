import type { ReactNode } from 'react';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { useRotatedOverlayStyle } from './use-rotated-overlay-style';

interface GridItemHandlesProps {
	/** Client ID of the grid item. */
	clientId: string;
	/** Rotation of the grid item in degrees, including a previewed one. */
	angle: number;
	/** The handles. */
	children: ReactNode;
}

/**
 * A small toolbar of handles under the bottom right corner of a selected grid
 * item.
 *
 * It sits in an overlay that turns with the block, and turns the other way,
 * so that it stays upright like the block toolbar.
 */
export function GridItemHandles( {
	clientId,
	angle,
	children,
}: GridItemHandlesProps ) {
	const blockElement = useBlockElement( clientId ) as HTMLElement | null;
	const overlayStyle = useRotatedOverlayStyle( blockElement, angle );

	if ( ! blockElement ) {
		return null;
	}

	return (
		<BlockPopoverCover
			className="block-editor-grid-item-handles"
			clientId={ clientId }
			__unstablePopoverSlot="__unstable-block-tools-after"
			additionalStyles={ overlayStyle }
		>
			<div className="block-editor-grid-item-handles__box">
				<div
					className="block-editor-grid-item-handles__toolbar"
					style={ { rotate: `${ -angle }deg` } }
				>
					{ children }
				</div>
			</div>
		</BlockPopoverCover>
	);
}
