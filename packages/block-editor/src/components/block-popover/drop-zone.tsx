import { useSelect } from '@wordpress/data';
import { useReducedMotion } from '@wordpress/compose';
import { __unstableMotion as motion } from '@wordpress/components';
import { store as blockEditorStore } from '../../store';
import BlockPopoverCover from './cover';
import type { PrivateBlockPopoverSlotProps } from './types';

const animateVariants = {
	hide: { opacity: 0, scaleY: 0.75 },
	show: { opacity: 1, scaleY: 1 },
	exit: { opacity: 0, scaleY: 0.9 },
};

function BlockDropZonePopover( {
	__unstablePopoverSlot,
	__unstableContentRef,
}: PrivateBlockPopoverSlotProps ) {
	const { clientId } = useSelect( ( select ): { clientId?: string } => {
		const { getBlockOrder, getBlockInsertionPoint } =
			select( blockEditorStore );
		const insertionPoint = getBlockInsertionPoint();
		const order = getBlockOrder( insertionPoint.rootClientId );

		if ( ! order.length ) {
			return {};
		}

		return {
			// A non-empty order always has an insertion index.
			clientId: order[ insertionPoint.index! ],
		};
	}, [] );
	const reducedMotion = useReducedMotion();

	return (
		<BlockPopoverCover
			// Without a block the popover renders nothing.
			clientId={ clientId! }
			__unstablePopoverSlot={ __unstablePopoverSlot }
			__unstableContentRef={ __unstableContentRef }
			className="block-editor-block-popover__drop-zone"
		>
			<motion.div
				data-testid="block-popover-drop-zone"
				initial={
					reducedMotion ? animateVariants.show : animateVariants.hide
				}
				animate={ animateVariants.show }
				exit={
					reducedMotion ? animateVariants.show : animateVariants.exit
				}
				className="block-editor-block-popover__drop-zone-foreground"
			/>
		</BlockPopoverCover>
	);
}

export default BlockDropZonePopover;
