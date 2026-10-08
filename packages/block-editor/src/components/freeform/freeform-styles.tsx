import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useStyleOverride } from '../../hooks/utils';
import { canHoldACanvas, collectCanvases } from './canvases';
import { getCanvasesCss, getMoveModeCss } from './override-css';
import {
	canDissolveIntoCanvas,
	getLayoutSupport,
	planSectionFlatten,
} from './flatten';

/**
 * Styles every canvas in the post, all the time.
 *
 * Deliberately not tied to the selection: the blocks in a converted section do
 * not re-render, so this stylesheet is the only thing holding them in position.
 * Mount it per-canvas and a section would fall back into flow the moment you
 * clicked something else, with its blocks jumping between their placed and
 * their original positions depending on what happened to be selected.
 *
 * It also says which blocks are moved rather than typed into. That is asked of
 * the same thing that decides it — the blocks a section's canvas would hold,
 * which is what `planSectionFlatten` works out — so a block in a column counts
 * from the start, before the drag that lifts it out of there.
 */
export default function FreeformStyles() {
	const css = useSelect( ( select ) => {
		const {
			getBlock,
			getBlocks,
			getBlockOrder,
			getBlockName,
			getBlockEditingMode,
			getTemplateLock,
			getSectionRootClientId,
		} = unlock( select( blockEditorStore ) );

		// Sections whose blocks the canvas holds: a converted one, and one
		// that could be converted, since the first drag is what converts it.
		// Where the canvas has no business — a content-only or disabled
		// section, or one a template has locked down — nothing is held.
		const sections = getBlockOrder( getSectionRootClientId() ?? '' ).filter(
			( clientId ) =>
				!! getBlockOrder( clientId ).length &&
				canHoldACanvas(
					getLayoutSupport( getBlockName( clientId ) )
				) &&
				! getTemplateLock( clientId ) &&
				getBlockEditingMode( clientId ) === 'default'
		);

		// What is inside a block that arranges its own children — a Button in a
		// Buttons, an image in a Gallery — is part of it: the canvas places the
		// whole thing and a press anywhere on it picks the whole thing up. So
		// those contents are in move mode too, or the only pixels you can
		// actually press would still look and behave like text.
		const arrangesItsChildren = ( clientId ) =>
			getLayoutSupport( getBlockName( clientId ) )?.allowSwitching ===
			false;
		const descendants = ( clientId ) =>
			getBlockOrder( clientId ).flatMap( ( child ) => [
				child,
				...descendants( child ),
			] );

		const citizens = sections.flatMap(
			( clientId ) =>
				planSectionFlatten(
					getBlock( clientId ),
					canDissolveIntoCanvas
				).citizens
		);
		const arrangements = citizens.filter( arrangesItsChildren );
		const movable = [ ...citizens, ...arrangements.flatMap( descendants ) ];

		return [
			getCanvasesCss( collectCanvases( getBlocks() ) ),
			getMoveModeCss( movable, arrangements ),
		]
			.filter( Boolean )
			.join( '\n' );
	}, [] );

	useStyleOverride( { id: 'freeform-canvases', css } );

	return null;
}
