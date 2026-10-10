import type { RefObject } from 'react';
import BlockPopoverCover from '../block-popover/cover';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';

type BlockSelectionLabelProps = {
	/** Client ID of the selected block. */
	clientId: string;
	/** Ref holding the content scroll container. */
	__unstableContentRef?: RefObject< HTMLElement | null >;
};

/**
 * Shows the name of the selected block pinned to the top-left corner of its
 * selection outline, so it is clear what is selected on the canvas.
 */
export default function BlockSelectionLabel( {
	clientId,
	__unstableContentRef,
}: BlockSelectionLabelProps ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle = useBlockDisplayTitle( { clientId, maximumLength: 35 } );
	// A block renamed by the user shows its custom name, like the list view.
	const title = blockInformation?.name || blockTitle;

	if ( ! title ) {
		return null;
	}

	return (
		<BlockPopoverCover
			clientId={ clientId }
			className="block-editor-block-list__block-selection-label-popover"
			__unstableContentRef={ __unstableContentRef }
		>
			{ /* The block already announces its name, so the label is decorative. */ }
			<span
				className="block-editor-block-list__block-selection-label"
				aria-hidden="true"
			>
				{ title }
			</span>
		</BlockPopoverCover>
	);
}
