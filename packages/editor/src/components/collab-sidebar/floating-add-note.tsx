import { __ } from '@wordpress/i18n';
import { Button, Popover } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { comment as commentIcon } from '@wordpress/icons';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
	// @ts-expect-error `@wordpress/block-editor` has no type declarations.
} from '@wordpress/block-editor';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { useAnchor } from '@wordpress/rich-text';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { hasNoteFormatInRange, readInlineSelection } from './utils';

const { useBlockElement } = unlock( blockEditorPrivateApis );

/**
 * Milliseconds the selection must stay stable before the button appears, so
 * the canvas doesn't flicker a button on every transient selection change
 * while the user is still dragging to highlight.
 */
const SHOW_DELAY_MS = 300;

/**
 * Height of the virtual anchor for a block-level note, so the button sits
 * beside the block's first line rather than centred on its top edge.
 */
const BLOCK_ANCHOR_HEIGHT = 32;

/**
 * What the floating button would attach a note to. Kept flat so `useSelect`
 * can shallow-compare it and skip re-renders while the target is unchanged.
 */
type FloatingTarget = {
	clientId: string;
	/**
	 * The top-level block containing `clientId` (itself when not nested). Its
	 * right edge is the margin the button floats in: a nested block's own
	 * edge would land on a sibling in a row, columns or a navigation menu.
	 */
	anchorClientId: string;
	/**
	 * The rich-text range a note would wrap, or null when the note attaches to
	 * the block as a whole (a collapsed caret, or a block with no text).
	 */
	attributeKey: string | null;
	start: number | null;
	end: number | null;
};

type FloatingAddNoteProps = {
	/**
	 * Opens the new-note form for the target block. The inline range itself is
	 * read back from the block-editor store when the note is saved, so the
	 * selection must survive the click (see `onMouseDown`).
	 */
	onClick: ( clientId: string ) => void;
};

/**
 * The target the floating button would attach a note to, or null when the
 * button should stay hidden: nothing is selected, the selection spans blocks,
 * the block can't take notes (invalid, unregistered, or classic), the selected
 * text already overlaps a `core/note` marker (the note format syncs the sidebar
 * to that note on its own), or the new-note form is already open.
 */
function useFloatingButtonTarget(): FloatingTarget | null {
	return useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getSelectionStart,
			getSelectionEnd,
			getBlock,
			getBlockParents,
		} = select( blockEditorStore );

		const clientId = getSelectedBlockClientId();
		if ( ! clientId ) {
			return null;
		}

		// Mirrors the block toolbar's "Add note" item.
		const block = getBlock( clientId );
		if (
			! block?.isValid ||
			block.name === 'core/freeform' ||
			block.name === getUnregisteredTypeHandlerName()
		) {
			return null;
		}

		// The selection persists while the user types in the sidebar form, so
		// without this the button would keep floating beside the block after
		// it has done its job.
		if ( unlock( select( editorStore ) ).getSelectedNote() === 'new' ) {
			return null;
		}

		const anchorClientId = getBlockParents( clientId )[ 0 ] ?? clientId;
		const inlineSelection = readInlineSelection(
			getSelectionStart(),
			getSelectionEnd()
		);
		if ( ! inlineSelection ) {
			return {
				clientId,
				anchorClientId,
				attributeKey: null,
				start: null,
				end: null,
			};
		}

		const { attributeKey, start, end } = inlineSelection;
		if (
			hasNoteFormatInRange( block.attributes[ attributeKey ], start, end )
		) {
			return null;
		}

		return { clientId, anchorClientId, attributeKey, start, end };
	}, [] );
}

/**
 * A floating "Add note" button surfaced in the margin beside the selected
 * block: on the selected line when text is highlighted, the on-select entry
 * point familiar from Medium and Google Docs, and at the block's first line
 * otherwise, so a click on an image or a heading is enough to leave a
 * block-level note. It complements the block toolbar entry rather than
 * replacing it.
 */
export function FloatingAddNote( { onClick }: FloatingAddNoteProps ) {
	const target = useFloatingButtonTarget();
	const isInline = target?.attributeKey !== null;

	// Re-keying on the target restarts the delay whenever it changes (e.g.
	// while the user is still dragging), and hides the button the moment the
	// block is deselected. Readiness records the key that completed the delay
	// rather than a boolean, so a target that changes straight to another one
	// can't paint the button at its new position before the effect resets it.
	const targetKey = target
		? `${ target.clientId }:${ target.attributeKey }:${ target.start }:${ target.end }`
		: null;
	const [ readyTargetKey, setReadyTargetKey ] = useState< string | null >(
		null
	);
	useEffect( () => {
		setReadyTargetKey( null );
		if ( ! targetKey ) {
			return;
		}
		const timer = setTimeout(
			() => setReadyTargetKey( targetKey ),
			SHOW_DELAY_MS
		);
		return () => clearTimeout( timer );
	}, [ targetKey ] );
	const isReady = !! targetKey && readyTargetKey === targetKey;

	// `useAnchor` derives a virtual anchor from the block element's live DOM
	// range, reading `ownerDocument.defaultView.getSelection()`, so an iframed
	// canvas resolves its own selection without any special casing here.
	const blockElement: HTMLElement | null = useBlockElement(
		target?.clientId
	);
	const anchorBlockElement: HTMLElement | null = useBlockElement(
		target?.anchorClientId
	);
	const selectionAnchor = useAnchor( {
		editableContentElement: blockElement,
	} );

	// Anchor in the margin beside the top-level block: on the selected line
	// for an inline note (the Google Docs placement), at the selected block's
	// top for a block-level one. Anywhere inside the content column either
	// covers neighbouring text or, on a first line, lands on the block
	// toolbar.
	const marginAnchor = useMemo( () => {
		if (
			! blockElement ||
			! anchorBlockElement ||
			( isInline && ! selectionAnchor )
		) {
			return null;
		}
		const { ownerDocument } = blockElement;
		return {
			ownerDocument,
			contextElement: blockElement,
			getBoundingClientRect() {
				const blockRect = blockElement.getBoundingClientRect();
				const { right } = anchorBlockElement.getBoundingClientRect();
				const { top, height } =
					isInline && selectionAnchor
						? selectionAnchor.getBoundingClientRect()
						: {
								top: blockRect.top,
								height: Math.min(
									blockRect.height,
									BLOCK_ANCHOR_HEIGHT
								),
						  };
				const DOMRect =
					ownerDocument.defaultView?.DOMRect ?? window.DOMRect;
				return new DOMRect( right, top, 0, height );
			},
		};
	}, [ selectionAnchor, blockElement, anchorBlockElement, isInline ] );

	if ( ! isReady || ! target || ! marginAnchor ) {
		return null;
	}

	return (
		<Popover
			placement="right"
			offset={ 8 }
			focusOnMount={ false }
			anchor={ marginAnchor }
			// The high-contrast frame the block toolbar uses.
			variant="toolbar"
			// The slot the inline rich-text popovers use, so the button is
			// clipped to the canvas and shifts to stay inside it instead of
			// floating over the header or footer chrome.
			__unstableSlotName="__unstable-block-tools-after"
			className="editor-collab-sidebar__floating-add-note"
		>
			<Button
				icon={ commentIcon }
				label={ __( 'Add note' ) }
				size="compact"
				// Keep focus in the editor: the captured rich-text selection
				// in the block-editor store must survive until
				// `useNoteActions.onCreate` reads it.
				onMouseDown={ ( event: React.MouseEvent ) =>
					event.preventDefault()
				}
				onClick={ () => onClick( target.clientId ) }
			/>
		</Popover>
	);
}
