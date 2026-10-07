import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { useStyleOverride } from '../../hooks/utils';
import { collectCanvases } from './canvases';
import { getCanvasesCss } from './override-css';

/**
 * Styles every canvas in the post, all the time.
 *
 * Deliberately not tied to the selection: the blocks in a converted section do
 * not re-render, so this stylesheet is the only thing holding them in position.
 * Mount it per-canvas and a section would fall back into flow the moment you
 * clicked something else, with its blocks jumping between their placed and
 * their original positions depending on what happened to be selected.
 */
export default function FreeformStyles() {
	const css = useSelect( ( select ) => {
		const { getBlocks } = select( blockEditorStore );
		return getCanvasesCss( collectCanvases( getBlocks() ) );
	}, [] );

	useStyleOverride( { id: 'freeform-canvases', css } );

	return null;
}
