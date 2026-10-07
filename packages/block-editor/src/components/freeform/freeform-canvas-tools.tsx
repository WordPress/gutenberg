import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import FreeformCanvas from './freeform-canvas';
import FreeformStyles from './freeform-styles';

/**
 * Mounts the freeform canvas editing surface for whichever section the current
 * selection sits in.
 *
 * A canvas is a section — a top-level block, which is what the editor already
 * treats as one — or any Group at any depth inside one, so blocks in a nested
 * Group drag just like blocks in the section itself. It is a canvas whether or
 * not it has been converted yet: the first drag converts it, in place and at
 * the layout it already had.
 *
 * Containers are limited to sections and Groups on purpose. Converting rewrites
 * the container's layout and every child's position, which is fair game for
 * something whose whole job is holding a layout, and a surprise inside, say, a
 * Buttons block, where it would break the block's own arrangement.
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
				getSectionRootClientId,
			} = unlock( select( blockEditorStore ) );

			const selected = getSelectedBlockClientIds();
			if ( ! selected.length || getSettings().isDistractionFree ) {
				return {};
			}

			const sectionRoot = getSectionRootClientId() ?? '';
			const hasChildren = ( clientId ) =>
				getBlockOrder( clientId ).length > 0;
			const isFreeform = ( clientId ) =>
				!! clientId &&
				getBlockAttributes( clientId )?.layout?.type === 'freeform';
			// A section, or a Group nested anywhere inside the content.
			const canHoldACanvas = ( clientId ) =>
				!! clientId &&
				hasChildren( clientId ) &&
				( getBlockRootClientId( clientId ) === sectionRoot ||
					getBlockName( clientId ) === 'core/group' );
			const isCanvasContainer = ( clientId ) =>
				isFreeform( clientId ) || canHoldACanvas( clientId );

			// Either the container itself is selected, or something inside it.
			const root = getBlockRootClientId( selected[ 0 ] );
			let canvas = null;
			if ( isCanvasContainer( selected[ 0 ] ) ) {
				canvas = selected[ 0 ];
			} else if ( isCanvasContainer( root ) ) {
				canvas = root;
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
					canvasClientId={ canvasClientId }
					selectedClientIds={ selectedClientIds }
					isCanvas={ isCanvas }
				/>
			) }
		</>
	);
}
