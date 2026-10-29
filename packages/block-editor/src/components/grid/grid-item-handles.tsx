import type { ReactNode } from 'react';
import { Toolbar } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { getCornerToolbarStyle, getLowestCorner } from '../../utils/rotation';
import { useRotatedOverlayStyle } from './use-rotated-overlay-style';

// Space between the block and the toolbar, in pixels.
const TOOLBAR_GAP = 8;

interface GridItemHandlesProps {
	/** Client ID of the grid item. */
	clientId: string;
	/** Rotation of the grid item in degrees, including a previewed one. */
	angle: number;
	/**
	 * Rotation of the grid item in degrees, without a previewed one. The
	 * toolbar is under the block's lowest corner at this angle.
	 */
	anchorAngle: number;
	/** The handles. */
	children: ReactNode;
}

/**
 * A small toolbar of handles under the bottom right corner of a selected grid
 * item.
 *
 * It sits in an overlay that turns with the block, which the rotate handle
 * turns the block around. On a rotated block, it stays upright like the block
 * toolbar, under the block's lowest corner. While the block turns, it follows
 * that corner, and it moves to the new lowest corner once the rotation is
 * released.
 */
export function GridItemHandles( {
	clientId,
	angle,
	anchorAngle,
	children,
}: GridItemHandlesProps ) {
	const blockElement = useBlockElement( clientId ) as HTMLElement | null;
	const overlayStyle = useRotatedOverlayStyle( blockElement, angle );
	const corner = useMemo(
		() => getLowestCorner( anchorAngle ),
		[ anchorAngle ]
	);

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
				<Toolbar
					className="block-editor-grid-item-handles__toolbar"
					label={ __( 'Block handles' ) }
					style={ getCornerToolbarStyle(
						angle,
						corner,
						TOOLBAR_GAP
					) }
				>
					{ children }
				</Toolbar>
			</div>
		</BlockPopoverCover>
	);
}
