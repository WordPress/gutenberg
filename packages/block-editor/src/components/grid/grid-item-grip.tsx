import { dragHandle, Icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import BlockDraggable from '../block-draggable';
import { useRotatedOverlayStyle } from './use-rotated-overlay-style';
import { setInlineStyle } from './utils';

interface GridItemGripProps {
	/** Client ID of the grid item. */
	clientId: string;
	/** Rotation of the grid item in degrees. */
	angle: number;
}

/**
 * A grip on the corner of a selected grid item, for dragging it to other
 * cells. The item stays in place, dimmed, while the grid shows where it will
 * land.
 */
export function GridItemGrip( { clientId, angle }: GridItemGripProps ) {
	const blockElement: HTMLElement | null = useBlockElement( clientId );
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
			<BlockDraggable
				clientIds={ [ clientId ] }
				onDragStart={ () =>
					setInlineStyle( blockElement, 'opacity', '0.5' )
				}
				onDragEnd={ () =>
					setInlineStyle( blockElement, 'opacity', '' )
				}
			>
				{ ( draggableProps: Record< string, unknown > ) => (
					<div
						{ ...draggableProps }
						className="block-editor-grid-item-handles__grip"
						title={ __( 'Drag' ) }
						// The grip only works with a pointer. Keyboard users
						// move grid items with the movers in the toolbar.
						aria-hidden="true"
					>
						<Icon icon={ dragHandle } size={ 20 } />
					</div>
				) }
			</BlockDraggable>
		</BlockPopoverCover>
	);
}
