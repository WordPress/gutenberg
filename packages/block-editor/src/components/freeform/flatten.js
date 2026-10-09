import { getBlockSupport } from '@wordpress/blocks';
import { canHoldACanvas } from './canvases';

/**
 * A block type's layout support, under either of the names it goes by.
 *
 * @param {string} name A block name.
 * @return {boolean|Object|undefined} The `layout` support.
 */
export function getLayoutSupport( name ) {
	return (
		getBlockSupport( name, 'layout' ) ??
		getBlockSupport( name, '__experimentalLayout' )
	);
}

/**
 * Whether a section's canvas should absorb this block, for the real registry.
 *
 * @param {Object} block  A block, with `name`, `attributes` and `innerBlocks`.
 * @param {Object} parent The block it sits in.
 * @return {boolean} Whether the section absorbs it.
 */
export function canDissolveIntoCanvas( block, parent ) {
	return isAbsorbable( block, parent, getLayoutSupport );
}

/**
 * Whether a block carries styling you can see, rather than being scaffolding.
 *
 * This is what decides whether a nested container is absorbed into the
 * section's canvas or kept as a box on it. A Group with a background, a border,
 * padding, a minimum height or a shadow is something on the page: dissolving it
 * would take a visible card away. A Group with none of those only exists to
 * hold what is inside it, which the section can do itself.
 *
 * `blockGap` deliberately does not count. It spaces out what is inside the
 * container and leaves no mark of its own, and conversion captures the
 * positions it produced anyway, so absorbing such a container changes nothing
 * on screen.
 *
 * A class name does not count either. Patterns add them freely and most carry
 * nothing visual, so reading them as styling would keep almost every wrapper —
 * at the cost of a class that really does paint something being missed.
 *
 * @param {Object} [attributes] A block's attributes.
 * @return {boolean} Whether it has visible styling of its own.
 */
export function hasVisualStyling( attributes ) {
	const style = attributes?.style ?? {};
	return !! (
		attributes?.backgroundColor ||
		attributes?.gradient ||
		attributes?.borderColor ||
		style.color?.background ||
		style.color?.gradient ||
		style.background ||
		style.border ||
		style.spacing?.padding ||
		style.dimensions?.minHeight ||
		style.shadow ||
		style.outline
	);
}

/**
 * Whether the section's canvas absorbs a block, dissolving it.
 *
 * A section is one canvas, so anything between it and the content that is only
 * there to arrange things is absorbed, and the content inside comes out onto
 * the canvas at the position it already had. Three kinds of block go:
 *
 * - A grid of containers — Columns — see `isGridOfContainers`.
 * - A cell of one — a column — whatever it carries. A column exists only to put
 *   things side by side, and that is the arrangement being replaced.
 * - A container that arranges its contents: a Row, a Stack, a Grid. Same
 *   reason, and like a column it goes whatever it is styled with.
 * - A container with no styling of its own: the bare wrapper Group that
 *   patterns put around things. See `hasVisualStyling`.
 *
 * Everything else stays whole, as a block on the canvas: a Group with a
 * background is a card, and a card is moved, not dismantled.
 *
 * @param {Object}   block      A block, with `name`, `attributes`,
 *                              `innerBlocks`.
 * @param {Object}   parent     The block it sits in.
 * @param {Function} getSupport Reads a block type's `layout` support.
 * @return {boolean} Whether the canvas absorbs it.
 */
export function isAbsorbable( block, parent, getSupport ) {
	if ( ! canHoldACanvas( getSupport( block.name ) ) ) {
		// Not a container blocks can be placed in — but it may be a grid of
		// them, which is absorbed through its cells.
		return isGridOfContainers( block, getSupport );
	}

	// A cell of a grid is scaffolding by definition, however it is styled.
	if ( canArrangeChildren( getSupport( parent?.name ) ) ) {
		return true;
	}

	// So is a container that arranges what is in it. A Row and a Stack are a
	// Group with a flex layout, a Grid is one with a grid layout, and all of
	// them exist to put their contents in an order — side by side, one above
	// the next, in cells. That ordering is the thing a canvas replaces, so it
	// goes the way a Columns does, whatever it is styled with.
	if ( arrangesItsContents( block.attributes?.layout ) ) {
		return true;
	}

	return ! hasVisualStyling( block.attributes );
}

/**
 * Whether a container is a grid of containers, and so a grid inside the grid.
 *
 * A section is one canvas: anything in it can be moved anywhere in it. A block
 * that arranges its own children in containers breaks that promise, because its
 * contents are boxed into those containers and can only be moved within one of
 * them. Columns is the case you meet — an item in the second column cannot be
 * dragged into the first, which is not what a canvas means.
 *
 * The signal is the shape of the block, not its name: a container that
 * arranges its children (`allowSwitching: false`, the flag every block that
 * exists to arrange things carries) whose children can themselves hold blocks.
 * That is Columns and its Columns. It is deliberately not Buttons, Gallery,
 * Navigation or the paginations: they arrange their children too, but those
 * children — a Button, an Image, a Navigation Link — are not containers, so
 * there is no inner grid and nothing to dissolve. Dissolving them would throw
 * away the arrangement the block is for.
 *
 * @param {Object}   block      A block, with `name` and `innerBlocks`.
 * @param {Function} getSupport Reads a block type's `layout` support.
 * @return {boolean} Whether the section's canvas should absorb it.
 */
export function isGridOfContainers( block, getSupport ) {
	const children = block.innerBlocks ?? [];

	// A wrapper with no containers in it is not a grid of containers, whatever
	// its layout says. A Columns with no columns is a block with nothing in it,
	// and the section leaves it be rather than deciding it should not exist.
	return (
		children.length > 0 &&
		canArrangeChildren( getSupport( block.name ) ) &&
		children.every( ( child ) =>
			canHoldACanvas( getSupport( child.name ) )
		)
	);
}

/**
 * Whether a container's layout puts its contents in an order of its own.
 *
 * `flex` is a Row or a Stack, `grid` is a Grid. A Group laid out `default` or
 * `constrained` only holds its blocks in flow and is a box rather than an
 * arrangement, so it stays whole when it has a look of its own.
 *
 * @param {Object} [layout] A block's `layout` attribute.
 * @return {boolean} Whether the canvas replaces what it does.
 */
function arrangesItsContents( layout ) {
	return layout?.type === 'flex' || layout?.type === 'grid';
}

function canArrangeChildren( layoutSupport ) {
	return !! layoutSupport && layoutSupport?.allowSwitching === false;
}

/**
 * Whether a container is one cell of a grid of containers — a column.
 *
 * A column holds blocks, so on its own it looks like a perfectly good canvas,
 * and treating it as one is what boxes its contents in. So when the canvas for
 * a selection is being worked out, a column is stepped over: the canvas is the
 * section the whole grid sits in.
 *
 * This asks about one container and its parent, rather than about the whole
 * wrapper the way `isGridOfContainers` does, so that walking up from a
 * selection never has to read a block tree.
 *
 * @param {boolean|Object|undefined} ownSupport    The container's `layout`
 *                                                 support.
 * @param {boolean|Object|undefined} parentSupport Its parent's `layout`
 *                                                 support.
 * @return {boolean} Whether it is a cell rather than a canvas.
 */
export function isArrangedContainer( ownSupport, parentSupport ) {
	return canHoldACanvas( ownSupport ) && canArrangeChildren( parentSupport );
}

/**
 * How to make a section's contents into a single flat canvas.
 *
 * Returns the blocks that should end up as the section's own children, the
 * moves that get them there, and the wrappers left over afterwards. Nothing is
 * measured or changed here: the caller measures the section first, while it is
 * all still in flow, because the moment a block leaves its column the column
 * reflows and the position being captured is gone.
 *
 * The moves are grouped by the wrapper they come out of so that the caller can
 * put each set back where the wrapper stood. Hoisting everything to the end
 * instead would be simpler, and invisible on the canvas, but the section's
 * children are also its reading order, its tab order and its List View, and
 * those would all jump.
 *
 * @param {Object}   section     The section block, with `innerBlocks`.
 * @param {Function} canDissolve Whether the canvas absorbs a block, given the
 *                               block and the block it sits in; see
 *                               `isAbsorbable`.
 * @return {{citizens: string[], wrappers: Object[]}} The section's children in
 *         the document order they should end up in, and one entry per wrapper
 *         to dissolve — its `clientId` to remove, and the `moves` that empty it
 *         first, each naming the container the blocks come out of. Only the
 *         outermost wrappers are named, since removing one takes everything
 *         still inside it.
 */
export function planSectionFlatten( section, canDissolve ) {
	const citizens = [];
	const wrappers = [];
	let moves = [];

	// Collects what should be hoisted out of a wrapper. The wrapper's own
	// children are the containers — the columns — so the blocks to hoist are a
	// level below that, and each set is recorded against the container it
	// actually sits in: a Columns nested in a column means those blocks come
	// out of that inner column, not out of the outer one.
	const descend = ( wrapper ) => {
		for ( const child of wrapper.innerBlocks ?? [] ) {
			if ( canDissolve( child, wrapper ) ) {
				descend( child );
				continue;
			}
			citizens.push( child.clientId );
			// Each set is recorded against the block it actually sits in,
			// which is not always the wrapper the caller started from: a
			// column's contents come out of that column.
			const last = moves[ moves.length - 1 ];
			if ( last?.fromRootClientId === wrapper.clientId ) {
				last.clientIds.push( child.clientId );
			} else {
				moves.push( {
					clientIds: [ child.clientId ],
					fromRootClientId: wrapper.clientId,
				} );
			}
		}
	};

	for ( const child of section.innerBlocks ?? [] ) {
		if ( canDissolve( child, section ) ) {
			moves = [];
			descend( child );
			wrappers.push( { clientId: child.clientId, moves } );
		} else {
			citizens.push( child.clientId );
		}
	}

	return { citizens, wrappers };
}
