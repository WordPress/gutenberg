import { __ } from '@wordpress/i18n';
import {
	Popover,
	Toolbar,
	ToolbarButton,
	ToolbarGroup,
	SVG,
	Path,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
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
 * Comment bubble with a plus in the middle: the "start a note" affordance,
 * mirroring the on-select entry point in Google Docs. Composed locally rather
 * than added to `@wordpress/icons` since it's specific to this entry point.
 */
const addNoteIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M18 4H6c-1.1 0-2 .9-2 2v12.9c0 .6.5 1.1 1.1 1.1.3 0 .5-.1.8-.3L8.5 17H18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm.5 11c0 .3-.2.5-.5.5H7.9l-2.4 2.4V6c0-.3.2-.5.5-.5h12c.3 0 .5.2.5.5v9z" />
		<Path d="M11.25 6.75h1.5v2.75h2.75v1.5h-2.75v2.75h-1.5v-2.75H8.5v-1.5h2.75z" />
	</SVG>
);

/**
 * The inline range the floating button would attach a note to, or null when
 * the button should stay hidden: the selection is collapsed, spans blocks,
 * isn't inside a rich-text attribute, or already overlaps a `core/note`
 * marker (the note format syncs the sidebar to that note on its own).
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
	const popoverAnchor = useAnchor( {
		editableContentElement: blockElement,
	} );

	if ( ! isReady || ! inlineSelection || ! popoverAnchor ) {
		return null;
	}

	return (
		<Popover
			// Top-right of the selection reads as the natural continuation
			// point of what was just highlighted; the popover flips below
			// when the selection sits flush against the block toolbar.
			placement="top-end"
			offset={ 8 }
			focusOnMount={ false }
			anchor={ popoverAnchor }
			// The toolbar frame is the only visible surface, matching the
			// block toolbar, which renders its popover with this variant too.
			variant="unstyled"
			// The slot the inline rich-text popovers use, so the button is
			// clipped to the canvas and shifts to stay inside it instead of
			// floating over the header or footer chrome.
			__unstableSlotName="__unstable-block-tools-after"
			className="editor-collab-sidebar__floating-add-note"
		>
			<Toolbar label={ __( 'Notes' ) }>
				<ToolbarGroup>
					<ToolbarButton
						icon={ addNoteIcon }
						label={ __( 'Add note' ) }
						// Keep focus in the editor: the captured rich-text
						// selection in the block-editor store must survive
						// until `useNoteActions.onCreate` reads it.
						onMouseDown={ ( event: React.MouseEvent ) =>
							event.preventDefault()
						}
						onClick={ () => onClick( inlineSelection.clientId ) }
					/>
				</ToolbarGroup>
			</Toolbar>
		</Popover>
	);
}
