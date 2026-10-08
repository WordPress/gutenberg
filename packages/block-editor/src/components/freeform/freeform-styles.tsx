import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useStyleOverride } from '../../hooks/utils';
import { canHoldACanvas, collectCanvases } from './canvases';
import { getCanvasesCss, getPendingCanvasCss } from './override-css';
import { getLayoutSupport } from './flatten';

/**
 * Styles every canvas in the post, all the time.
 *
 * Deliberately not tied to the selection: the blocks in a converted section do
 * not re-render, so this stylesheet is the only thing holding them in position.
 * Mount it per-canvas and a section would fall back into flow the moment you
 * clicked something else, with its blocks jumping between their placed and
 * their original positions depending on what happened to be selected.
 *
 * Sections nobody has dragged in are styled too, though only to say their
 * blocks are moved rather than typed into. They are held still from the start —
 * see `isBlockFreeformLocked` — so without this they would be unselectable text
 * under a text cursor, with nothing to suggest they could be picked up.
 */
export default function FreeformStyles() {
	const css = useSelect( ( select ) => {
		const {
			getBlocks,
			getBlockOrder,
			getBlockName,
			getBlockAttributes,
			getBlockEditingMode,
			getTemplateLock,
			getSectionRootClientId,
		} = unlock( select( blockEditorStore ) );

		const pending = getBlockOrder( getSectionRootClientId() ?? '' ).filter(
			( clientId ) =>
				getBlockAttributes( clientId )?.layout?.type !== 'freeform' &&
				!! getBlockOrder( clientId ).length &&
				canHoldACanvas(
					getLayoutSupport( getBlockName( clientId ) )
				) &&
				! getTemplateLock( clientId ) &&
				getBlockEditingMode( clientId ) === 'default'
		);

		return [
			getCanvasesCss( collectCanvases( getBlocks() ) ),
			getPendingCanvasCss( pending ),
		]
			.filter( Boolean )
			.join( '\n' );
	}, [] );

	useStyleOverride( { id: 'freeform-canvases', css } );

	return null;
}
