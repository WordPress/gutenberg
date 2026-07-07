/**
 * WordPress dependencies
 */
import {
	createPortal,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { AsyncModeProvider, useSelect, useRegistry } from '@wordpress/data';
import { safeHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockListBlock from '../block-list/block';
import { LayoutProvider } from '../block-list/layout';

const SLOT_TAG_NAME = 'wp-inner-block-slot';

// The static markup surrounding the inner blocks is arbitrary HTML the block
// editor doesn't manage, so it provides no layout context: no alignments are
// available to the inner blocks.
const LAYOUT = { type: 'default', alignments: [] };

/**
 * Renders the static HTML fragments of a block with the `innerContent`
 * support, mounting each inner block at the position of its `null`
 * placeholder within the static markup.
 *
 * Unlike `InnerBlocks`, the rendered blocks are not a contiguous list: they
 * live at arbitrary positions inside markup the block editor doesn't manage.
 * The static fragments are sanitized with `safeHTML` before being injected
 * into the canvas — the same treatment block save content receives elsewhere
 * in the editor — and the inner blocks are portalled into placeholder
 * elements. Inner blocks are locked: they can be edited in place but not
 * moved, removed, or added to.
 *
 * @param {Object}  props            Component props.
 * @param {string}  props.clientId   Client ID of the block whose inner content
 *                                   should be rendered.
 * @param {string}  [props.html]     Slot-bearing markup to use verbatim instead of
 *                                   building it from the block's `innerContent`.
 *                                   The markup must already contain
 *                                   `<wp-inner-block-slot data-slot-index>` elements
 *                                   (e.g. a server-rendered shell). When omitted, the
 *                                   markup is derived from `innerContent` as usual.
 * @param {Element} [props.children] Pre-rendered inner-blocks children to portal
 *                                   wholesale into the first slot, instead of one
 *                                   portal per block. Required for controlled
 *                                   trees: their store sync lives in these
 *                                   children, so they must stay mounted.
 */
export default function InnerContent( { clientId, html: htmlProp, children } ) {
	const { innerContent, order, selectedClientIds } = useSelect(
		( select ) => {
			const { getBlock, getBlockOrder, getSelectedBlockClientIds } =
				select( blockEditorStore );
			return {
				innerContent: getBlock( clientId )?.innerContent,
				order: getBlockOrder( clientId ),
				selectedClientIds: getSelectedBlockClientIds(),
			};
		},
		[ clientId ]
	);
	const html = useMemo( () => {
		// An externally supplied shell (e.g. server-rendered) already carries its
		// own slot placeholders, so it is used as-is.
		if ( htmlProp !== undefined ) {
			return htmlProp;
		}
		let slotIndex = 0;
		return ( innerContent ?? [] )
			.map( ( item ) =>
				item === null
					? `<${ SLOT_TAG_NAME } data-slot-index="${ slotIndex++ }" style="display: contents"></${ SLOT_TAG_NAME }>`
					: item
			)
			.join( '' );
	}, [ htmlProp, innerContent ] );

	const registry = useRegistry();
	const containerRef = useRef();
	// `null` until the injected markup has been scanned: provided children
	// wait for it so they mount straight into their portal, once.
	const [ slots, setSlots ] = useState( null );

	// Moving a slot node into re-injected markup drops DOM focus, even though
	// the block selection survives in the store. Remember whether the caret
	// was inside an island so it can be restored afterwards.
	const restoreFocusRef = useRef( false );

	useLayoutEffect( () => {
		const container = containerRef.current;

		restoreFocusRef.current = container.contains(
			container.ownerDocument.activeElement
		);

		// Parse the new markup off-DOM. Sanitize it first: `safeHTML` removes
		// `<script>` elements and inline event handlers, matching how block
		// save content is rendered elsewhere in the editor.
		const template = container.ownerDocument.createElement( 'template' );
		template.innerHTML = safeHTML( html );

		const nextSlots = Array.from(
			template.content.querySelectorAll( SLOT_TAG_NAME )
		).sort(
			( a, b ) =>
				Number( a.dataset.slotIndex ) - Number( b.dataset.slotIndex )
		);

		// Carry the current slot nodes over into the new markup: the portalled
		// blocks move with them instead of remounting, so a re-rendered shell
		// doesn't flash the islands or reset their DOM state.
		container.querySelectorAll( SLOT_TAG_NAME ).forEach( ( slot ) => {
			const index = nextSlots.findIndex(
				( next ) => next.dataset.slotIndex === slot.dataset.slotIndex
			);
			if ( index !== -1 ) {
				nextSlots[ index ].replaceWith( slot );
				nextSlots[ index ] = slot;
			}
		} );

		container.replaceChildren( template.content );
		setSlots( nextSlots );
	}, [ html ] );

	// After the inner blocks re-portal into the freshly injected slots, refocus
	// the selected child's editable so RichText restores the caret from the
	// store. Best effort: a no-op when the caret was not inside this block.
	useEffect( () => {
		if ( ! restoreFocusRef.current ) {
			return;
		}
		restoreFocusRef.current = false;

		const selectedClientId = registry
			.select( blockEditorStore )
			.getSelectedBlockClientId();
		if ( ! selectedClientId ) {
			return;
		}

		containerRef.current
			?.querySelector(
				`[data-block="${ selectedClientId }"] [contenteditable="true"]`
			)
			?.focus();
	}, [ slots, registry ] );

	// Provided children carry their own rendering (and, for controlled trees,
	// the store sync), so they portal wholesale into the first slot. Until
	// the slot is discovered (pre-paint) they stay unmounted; rendering them
	// inline first and swapping into the portal would remount them. The
	// inline fallback only remains for markup without any slot.
	let portals;
	if ( children !== undefined ) {
		if ( slots === null ) {
			portals = null;
		} else if ( slots[ 0 ] ) {
			portals = createPortal(
				children,
				slots[ 0 ],
				'inner-content-children'
			);
		} else {
			portals = children;
		}
	} else {
		portals = order.map( ( childClientId, index ) =>
			slots?.[ index ]
				? createPortal(
						// Render the selected block synchronously, as the block list does.
						<AsyncModeProvider
							value={
								! selectedClientIds.includes( childClientId )
							}
						>
							<BlockListBlock
								rootClientId={ clientId }
								clientId={ childClientId }
							/>
						</AsyncModeProvider>,
						slots[ index ],
						childClientId
				  )
				: null
		);
	}

	return (
		<LayoutProvider value={ LAYOUT }>
			<div
				ref={ containerRef }
				className="block-editor-inner-content"
				style={ { display: 'contents' } }
			/>
			{ portals }
		</LayoutProvider>
	);
}
