/**
 * WordPress dependencies
 */
import {
	createPortal,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useSelect } from '@wordpress/data';
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
 * @param {Object} props          Component props.
 * @param {string} props.clientId Client ID of the block whose inner content
 *                                should be rendered.
 */
export default function InnerContent( { clientId } ) {
	const { innerContent, order } = useSelect(
		( select ) => {
			const { getBlock, getBlockOrder } = select( blockEditorStore );
			return {
				innerContent: getBlock( clientId )?.innerContent,
				order: getBlockOrder( clientId ),
			};
		},
		[ clientId ]
	);
	const html = useMemo( () => {
		let slotIndex = 0;
		return ( innerContent ?? [] )
			.map( ( item ) =>
				item === null
					? `<${ SLOT_TAG_NAME } data-slot-index="${ slotIndex++ }" style="display: contents"></${ SLOT_TAG_NAME }>`
					: item
			)
			.join( '' );
	}, [ innerContent ] );

	const containerRef = useRef();
	const [ slots, setSlots ] = useState( [] );

	useLayoutEffect( () => {
		const container = containerRef.current;

		// Sanitize before injecting into the canvas: `safeHTML` removes
		// `<script>` elements and inline event handlers, matching how block
		// save content is rendered elsewhere in the editor.
		container.innerHTML = safeHTML( html );

		setSlots(
			Array.from( container.querySelectorAll( SLOT_TAG_NAME ) ).sort(
				( a, b ) =>
					Number( a.dataset.slotIndex ) -
					Number( b.dataset.slotIndex )
			)
		);
	}, [ html ] );

	return (
		<LayoutProvider value={ LAYOUT }>
			<div
				ref={ containerRef }
				className="block-editor-inner-content"
				style={ { display: 'contents' } }
			/>
			{ order.map( ( childClientId, index ) =>
				slots[ index ]
					? createPortal(
							<BlockListBlock
								rootClientId={ clientId }
								clientId={ childClientId }
							/>,
							slots[ index ],
							childClientId
					  )
					: null
			) }
		</LayoutProvider>
	);
}
