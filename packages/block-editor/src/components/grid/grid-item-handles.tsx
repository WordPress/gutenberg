import type { ReactNode } from 'react';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { getBoundingBoxCornerStyle } from './rotation';
import { useRotatedOverlayStyle } from './use-rotated-overlay-style';

// Space between the block's bounding box and the toolbar, in pixels.
const TOOLBAR_GAP = 8;

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
 * It sits in an overlay that turns with the block, which the rotate handle
 * turns the block around. On a rotated block, it stays upright like the block
 * toolbar, under the bottom right corner of the block's bounding box, so it
 * stays in the same place at any angle.
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
					style={ getBoundingBoxCornerStyle( angle, TOOLBAR_GAP ) }
				>
					{ children }
				</div>
			</div>
		</BlockPopoverCover>
	);
}
