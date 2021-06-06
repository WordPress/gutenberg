/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import InsertionPoint from './insertion-point';
import BlockPopover from './block-popover';
import { store as blockEditorStore } from '../../store';
import BlockContextualToolbar from './block-contextual-toolbar';
import { usePopoverScroll } from './use-popover-scroll';

/**
 * Renders block tools (the block toolbar, select/navigation mode toolbar, the
 * insertion point and a slot for the inline rich text toolbar). Must be wrapped
 * around the block content and editor styles wrapper or iframe.
 *
 * @param {Object} $0                                Props.
 * @param {Object} $0.children                       The block content and style container.
 * @param {Object} $0.__unstableContentRef           Ref holding the content scroll container.
 * @param {number} $0.__experimentalStickyBottom     Bottom sticky position of floating toolbar.
 * @param {number} $0.__experimentalStickyTop        Top sticky position of floating and top toolbar.
 * @param {number} $0.__experimentalStickyAreaBottom Offset of bottom side of sticky area.
 * @param {number} $0.__experimentalStickyAreaTop    Offset of top side of sticky area.
 */
export default function BlockTools( {
	children,
	__unstableContentRef,
	__experimentalStickyBottom,
	__experimentalStickyTop,
	__experimentalStickyAreaBottom: stickyAreaBottom,
	__experimentalStickyAreaTop: stickyAreaTop,
} ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const hasFixedToolbar = useSelect(
		( select ) => select( blockEditorStore ).getSettings().hasFixedToolbar,
		[]
	);

	return (
		<InsertionPoint __unstableContentRef={ __unstableContentRef }>
			{ ( hasFixedToolbar || ! isLargeViewport ) && (
				<BlockContextualToolbar
					isFixed
					__experimentalStickyTop={ __experimentalStickyTop }
				/>
			) }
			{ /* Even if the toolbar is fixed, the block popover is still
                 needed for navigation mode. */ }
			<BlockPopover
				__unstableContentRef={ __unstableContentRef }
				__experimentalStickyBottom={ __experimentalStickyBottom }
				__experimentalStickyTop={ __experimentalStickyTop }
				__experimentalStickyAreaBottom={ stickyAreaBottom }
				__experimentalStickyAreaTop={ stickyAreaTop }
			/>
			{ /* Used for the inline rich text toolbar. */ }
			<Popover.Slot
				name="block-toolbar"
				ref={ usePopoverScroll( __unstableContentRef ) }
			/>
			{ children }
			{ /* Forward compatibility: a place to render block tools behind the
                 content so it can be tabbed to properly. */ }
		</InsertionPoint>
	);
}
