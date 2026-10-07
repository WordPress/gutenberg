import { useSelect } from '@wordpress/data';
import { getBlockSupport } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import FreeformCanvas from './freeform-canvas';
import FreeformStyles from './freeform-styles';
import { canHoldACanvas } from './canvases';

/**
 * Mounts the freeform canvas editing surface for whichever section the current
 * selection sits in.
 *
 * A canvas is any container that holds blocks without insisting on how they are
 * arranged — a Group, a Column, a Cover — at any depth. Blocks inside a column
 * therefore drag exactly like blocks in the section around it. It is a canvas
 * whether or not it has been converted yet: the first drag converts it, in
 * place and at the layout it already had.
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
			const isOpenContainer = ( clientId ) => {
				if ( ! clientId || ! getBlockOrder( clientId ).length ) {
					return false;
				}
				const name = getBlockName( clientId );
				return canHoldACanvas(
					getBlockSupport( name, 'layout' ) ??
						getBlockSupport( name, '__experimentalLayout' )
				);
			};
			const isCanvasContainer = ( clientId ) =>
				isFreeform( clientId ) || isOpenContainer( clientId );

			// The container around the selection is the canvas, and the
			// selection is something on it. That order matters: a Group is
			// both a container and a block you want to drag, and checking it
			// first made selecting one show its own empty surface instead of
			// a grip, so Groups could never be moved.
			//
			// Only when nothing above the selection can hold a canvas is the
			// selection itself the canvas — that is a section selected on its
			// own, which shows the whole layout with nothing picked up.
			const root = getBlockRootClientId( selected[ 0 ] );
			let canvas = null;
			if ( isCanvasContainer( root ) ) {
				canvas = root;
			} else if ( isCanvasContainer( selected[ 0 ] ) ) {
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
