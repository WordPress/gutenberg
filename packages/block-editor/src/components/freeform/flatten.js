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
 * @param {Object} block A block, with `name` and `innerBlocks`.
 * @return {boolean} Whether it is a grid inside the grid.
 */
export function canDissolveIntoCanvas( block ) {
	return isGridOfContainers( block, getLayoutSupport );
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
 * @param {Function} canDissolve Whether a block is a grid inside the grid; see
 *                               `isGridOfContainers`.
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
		for ( const container of wrapper.innerBlocks ?? [] ) {
			for ( const child of container.innerBlocks ?? [] ) {
				if ( canDissolve( child ) ) {
					descend( child );
					continue;
				}
				citizens.push( child.clientId );
				const last = moves[ moves.length - 1 ];
				if ( last?.fromRootClientId === container.clientId ) {
					last.clientIds.push( child.clientId );
				} else {
					moves.push( {
						clientIds: [ child.clientId ],
						fromRootClientId: container.clientId,
					} );
				}
			}
		}
	};

	for ( const child of section.innerBlocks ?? [] ) {
		if ( canDissolve( child ) ) {
			moves = [];
			descend( child );
			wrappers.push( { clientId: child.clientId, moves } );
		} else {
			citizens.push( child.clientId );
		}
	}

	return { citizens, wrappers };
}
