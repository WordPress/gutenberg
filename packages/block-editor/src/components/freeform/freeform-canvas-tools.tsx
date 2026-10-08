import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import FreeformCanvas from './freeform-canvas';
import FreeformStyles from './freeform-styles';
import { canHoldACanvas } from './canvases';
import { getLayoutSupport, isArrangedContainer } from './flatten';

/**
 * Mounts the freeform canvas editing surface for whichever section the current
 * selection sits in.
 *
 * A canvas is any container that holds blocks without insisting on how they are
 * arranged — a Group, a Cover — at any depth. It is a canvas whether or not it
 * has been converted yet: the first drag converts it, in place and at the
 * layout it already had.
 *
 * A column is the exception. It holds blocks, so it looks like a canvas, but a
 * canvas that stops at the column edge is not one: an item could never be
 * dragged into the next column. So the walk up steps over it and the section is
 * the canvas, which the first drag dissolves the whole grid into. See
 * `isArrangedContainer` and `planSectionFlatten`.
 *
 * Blocks that arrange their own children are left alone; see `canHoldACanvas`.
 *
 * This is anchored on the editor rather than on a block because it has to
 * outlive any one selection: a group drag needs the surface to still be there
 * when the selection becomes a multi-selection, which hides per-block controls.
 */
export default function FreeformCanvasTools() {
	const { canvasClientId, selectedClientIds, isCanvas } = useSelect(
		( select ) => {
			const {
				getSelectedBlockClientIds,
				getBlockRootClientId,
				getBlockAttributes,
				getBlockName,
				getBlockEditingMode,
				getBlockOrder,
				getTemplateLock,
				getSettings,
			} = unlock( select( blockEditorStore ) );

			const selected = getSelectedBlockClientIds();
			if ( ! selected.length || getSettings().isDistractionFree ) {
				return {};
			}

			const isFreeform = ( clientId ) =>
				!! clientId &&
				getBlockAttributes( clientId )?.layout?.type === 'freeform';
			const supportOf = ( clientId ) =>
				clientId
					? getLayoutSupport( getBlockName( clientId ) )
					: undefined;
			const isOpenContainer = ( clientId ) => {
				if ( ! clientId || ! getBlockOrder( clientId ).length ) {
					return false;
				}
				return canHoldACanvas( supportOf( clientId ) );
			};
			// A column holds blocks, so it looks like a canvas, and treating it
			// as one is exactly what stops an item being dragged out of it into
			// the next column. It is one cell of a grid, not a canvas, so it is
			// stepped over: the canvas is the section the grid sits in, and the
			// first drag dissolves the grid into it.
			const isCell = ( clientId ) =>
				isArrangedContainer(
					supportOf( clientId ),
					supportOf( getBlockRootClientId( clientId ) )
				);
			const isCanvasContainer = ( clientId ) =>
				! isCell( clientId ) &&
				( isFreeform( clientId ) || isOpenContainer( clientId ) );

			// The container around the selection is the canvas, and the
			// selection is something on it. That order matters: a Group is
			// both a container and a block you want to drag, and checking it
			// first made selecting one show its own empty surface instead of
			// a grip, so Groups could never be moved.
			//
			// The walk keeps going up because the nearest container is not
			// always a canvas: a block in a column has a column above it,
			// which is a cell of a grid, so the canvas is the section further
			// up and the whole grid dissolves into it on the first drag.
			//
			// Only when nothing above the selection can hold a canvas is the
			// selection itself the canvas — that is a section selected on its
			// own, which shows the whole layout with nothing picked up.
			let canvas = null;
			let candidate = getBlockRootClientId( selected[ 0 ] );
			while ( candidate ) {
				if ( isCanvasContainer( candidate ) ) {
					canvas = candidate;
					break;
				}
				candidate = getBlockRootClientId( candidate );
			}
			if ( ! canvas && isCanvasContainer( selected[ 0 ] ) ) {
				canvas = selected[ 0 ];
			}

			if (
				! canvas ||
				getTemplateLock( canvas ) ||
				getBlockEditingMode( canvas ) !== 'default'
			) {
				return {};
			}

			return {
				canvasClientId: canvas,
				isCanvas: isFreeform( canvas ),
				// Selecting the section itself shows the surface with nothing
				// picked up, which is how you see the whole layout at once.
				selectedClientIds: canvas === selected[ 0 ] ? [] : selected,
			};
		},
		[]
	);

	return (
		<>
			<FreeformStyles />
			{ canvasClientId && (
				<FreeformCanvas
					// Keyed so moving to another canvas starts clean. The
					// component remembers that it converted its canvas, and
					// carrying that memory to the next one made it skip the
					// conversion entirely: the blocks got coordinates that
					// nothing was positioning them by, so the editing surface
					// moved and the content stayed put.
					key={ canvasClientId }
					canvasClientId={ canvasClientId }
					selectedClientIds={ selectedClientIds }
					isCanvas={ isCanvas }
				/>
			) }
		</>
	);
}
