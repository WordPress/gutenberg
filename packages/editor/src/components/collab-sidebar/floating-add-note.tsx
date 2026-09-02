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
import { useAnchor } from '@wordpress/rich-text';
import { unlock } from '../../lock-unlock';
import { hasNoteFormatInRange, readInlineSelection } from './utils';

const { useBlockElement } = unlock( blockEditorPrivateApis );

/**
 * Milliseconds the selection must stay stable before the button appears, so
 * the canvas doesn't flicker a button on every transient selection change
 * while the user is still dragging to highlight.
 */
const SHOW_DELAY_MS = 300;

type InlineSelection = {
	clientId: string;
	attributeKey: string;
	start: number;
	end: number;
};

type FloatingAddNoteProps = {
	/**
	 * Opens the new-note form for the block holding the selection. The inline
	 * range itself is read back from the block-editor store when the note is
	 * saved, so the selection must survive the click (see `onMouseDown`).
	 */
	onClick: ( clientId: string ) => void;
};

/**
 * The inline range the floating button would attach a note to, or null when
 * the button should stay hidden: the selection is collapsed, spans blocks,
 * isn't inside a rich-text attribute, already overlaps a `core/note` marker
 * (the note format syncs the sidebar to that note on its own).
 */
function useFloatingButtonSelection(): InlineSelection | null {
	return useSelect( ( select ) => {
		const {
			getSelectionStart,
			getSelectionEnd,
			getBlockAttributes,
			hasMultiSelection,
		} = select( blockEditorStore );

		if ( hasMultiSelection() ) {
			return null;
		}

		const inlineSelection = readInlineSelection(
			getSelectionStart(),
			getSelectionEnd()
		);
		if ( ! inlineSelection ) {
			return null;
		}

		const attributes = getBlockAttributes( inlineSelection.clientId );
		if (
			! attributes ||
			hasNoteFormatInRange(
				attributes[ inlineSelection.attributeKey ],
				inlineSelection.start,
				inlineSelection.end
			)
		) {
			return null;
		}

		return inlineSelection;
	}, [] );
}

/**
 * A floating "Add note" button surfaced next to a live text selection in the
 * canvas, the on-select entry point familiar from Medium and Google Docs. It
 * complements the block toolbar entry rather than replacing it.
 */
export function FloatingAddNote( { onClick }: FloatingAddNoteProps ) {
	const inlineSelection = useFloatingButtonSelection();

	// Re-keying on the captured range restarts the delay whenever the selection
	// changes (e.g. while the user is still dragging), and hides the button the
	// moment the selection collapses.
	const selectionKey = inlineSelection
		? `${ inlineSelection.clientId }:${ inlineSelection.attributeKey }:${ inlineSelection.start }:${ inlineSelection.end }`
		: null;
	const [ isReady, setIsReady ] = useState( false );
	useEffect( () => {
		setIsReady( false );
		if ( ! selectionKey ) {
			return;
		}
		const timer = setTimeout( () => setIsReady( true ), SHOW_DELAY_MS );
		return () => clearTimeout( timer );
	}, [ selectionKey ] );

	// `useAnchor` derives a virtual anchor from the block element's live DOM
	// range, reading `ownerDocument.defaultView.getSelection()`, so an iframed
	// canvas resolves its own selection without any special casing here.
	const blockElement: HTMLElement | null = useBlockElement(
		inlineSelection?.clientId
	);
	const selectionAnchor = useAnchor( {
		editableContentElement: blockElement,
	} );

	// Anchor in the margin beside the block, on the selected line: the
	// Google Docs placement. Anywhere inside the content column either covers
	// neighbouring text or, on a first line, lands on the block toolbar.
	const marginAnchor = useMemo( () => {
		if ( ! selectionAnchor || ! blockElement ) {
			return null;
		}
		const { ownerDocument } = blockElement;
		return {
			ownerDocument,
			contextElement: blockElement,
			getBoundingClientRect() {
				const { top, height } = selectionAnchor.getBoundingClientRect();
				const { right } = blockElement.getBoundingClientRect();
				const DOMRect =
					ownerDocument.defaultView?.DOMRect ?? window.DOMRect;
				return new DOMRect( right, top, 0, height );
			},
		};
	}, [ selectionAnchor, blockElement ] );

	if ( ! isReady || ! inlineSelection || ! marginAnchor ) {
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
				onClick={ () => onClick( inlineSelection.clientId ) }
			/>
		</Popover>
	);
}
