import type { RefObject } from 'react';
import clsx from 'clsx';
import { useSelect } from '@wordpress/data';
import { useLayoutEffect, useRef, useState } from '@wordpress/element';
import { getScrollContainer } from '@wordpress/dom';
import {
	isUnmodifiedDefaultBlock,
	store as blocksStore,
} from '@wordpress/blocks';
import BlockPopoverCover from '../block-popover/cover';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';

type BlockHoverLabelProps = {
	/** Client ID of the hovered block. */
	clientId: string;
	/** Ref holding the content scroll container. */
	__unstableContentRef?: RefObject< HTMLElement | null >;
};

/**
 * Reports whether the label fits above the block within the visible part of
 * the canvas. When it does not, the label nests inside the block's corner.
 */
function useFitsAbove(
	blockElement: HTMLElement | null,
	labelRef: RefObject< HTMLElement | null >
) {
	const [ fitsAbove, setFitsAbove ] = useState( true );

	useLayoutEffect( () => {
		if ( ! blockElement ) {
			return;
		}

		const { ownerDocument } = blockElement;
		const view = ownerDocument.defaultView;

		function update() {
			const scrollContainer = getScrollContainer( blockElement );
			const visibleTop =
				scrollContainer &&
				scrollContainer !== ownerDocument.documentElement
					? scrollContainer.getBoundingClientRect().top
					: 0;
			const room = blockElement!.getBoundingClientRect().top - visibleTop;
			setFitsAbove( room >= ( labelRef.current?.offsetHeight ?? 0 ) );
		}

		update();
		// Scroll events do not bubble, so capture them from any container.
		ownerDocument.addEventListener( 'scroll', update, true );
		view?.addEventListener( 'resize', update );

		return () => {
			ownerDocument.removeEventListener( 'scroll', update, true );
			view?.removeEventListener( 'resize', update );
		};
	}, [ blockElement, labelRef ] );

	return fitsAbove;
}

/**
 * Shows the name of the block under the pointer, so it is clear what a click
 * would select. The label sits just above the block's top-left corner, or
 * inside that corner when there is no room above.
 */
export default function BlockHoverLabel( {
	clientId,
	__unstableContentRef,
}: BlockHoverLabelProps ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTypeTitle = useSelect(
		( select ) => {
			const name = select( blockEditorStore ).getBlockName( clientId );
			return select( blocksStore ).getBlockType( name )?.title;
		},
		[ clientId ]
	);
	const blockElement = useBlockElement( clientId );
	const labelRef = useRef< HTMLSpanElement >( null );
	const fitsAbove = useFitsAbove( blockElement, labelRef );
	const isHidden = useSelect(
		( select ) => {
			const {
				getBlock,
				getBlockMode,
				isBlockSelected,
				isBlockMultiSelected,
			} = select( blockEditorStore );
			const block = getBlock( clientId );
			// The toolbar already represents the selected block, and an
			// empty default block shows its placeholder instead.
			return (
				! block ||
				isBlockSelected( clientId ) ||
				isBlockMultiSelected( clientId ) ||
				( isUnmodifiedDefaultBlock( block ) &&
					getBlockMode( clientId ) !== 'html' )
			);
		},
		[ clientId ]
	);
	// A block renamed by the user shows its custom name, like the list view,
	// and a synced block shows the entity it embeds. Otherwise the plain
	// block type title names the block: "Heading" rather than "Heading 2",
	// and never the block's content.
	const title =
		blockInformation?.name ||
		( blockInformation?.isSynced ? blockInformation.title : undefined ) ||
		blockTypeTitle;

	if ( isHidden || ! title ) {
		return null;
	}

	return (
		<BlockPopoverCover
			clientId={ clientId }
			className="block-editor-block-list__block-hover-label-popover"
			__unstableContentRef={ __unstableContentRef }
		>
			<span
				ref={ labelRef }
				className={ clsx(
					'block-editor-block-list__block-hover-label',
					{
						'is-inside': ! fitsAbove,
					}
				) }
			>
				{ title }
			</span>
		</BlockPopoverCover>
	);
}
