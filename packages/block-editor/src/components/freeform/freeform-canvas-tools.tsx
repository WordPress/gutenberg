import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import FreeformCanvas from './freeform-canvas';
import FreeformStyles from './freeform-styles';
import { canHoldACanvas } from './canvases';
import { getLayoutSupport } from './flatten';

/**
 * Mounts the freeform canvas editing surface for whichever section the current
 * selection sits in.
 *
 * The canvas is the section: a top-level block that holds other blocks without
 * insisting on how they are arranged, such as a Group or a Cover. It is a
 * canvas whether or not it has been converted yet — the first drag converts it,
 * in place and at the layout it already had.
 *
 * Only a section is ever a canvas. Anything nested that
 * holds blocks looks like a canvas and must not be one: a column, or the
 * wrapper Group a pattern puts inside a column, would each be a grid of its own
 * inside the section, and an item in one could never be dragged out of it. The
 * first drag dissolves them into the section instead; see `planSectionFlatten`.
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
				getBlockParents,
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
			const isOpenContainer = ( clientId ) => {
				if ( ! clientId || ! getBlockOrder( clientId ).length ) {
					return false;
				}
				return canHoldACanvas(
					getLayoutSupport( getBlockName( clientId ) )
				);
			};

			// A section is one canvas, so the canvas is the section: the
			// top-level block the selection sits in, however deep it sits.
			// Nothing nested is ever the canvas — a column, or the wrapper
			// Group a pattern puts inside one, would each be a grid of its own
			// inside the section, and an item in one could never be dragged
			// out of it.
			//
			// A selected section is its own canvas, which shows the whole
			// layout with nothing picked up.
			const ancestors = getBlockParents( selected[ 0 ] );
			const canvas = ancestors.length ? ancestors[ 0 ] : selected[ 0 ];

			if (
				! canvas ||
				! ( isFreeform( canvas ) || isOpenContainer( canvas ) ) ||
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
