/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ShadowDOMContainer from './shadow-dom-container';
import LayoutPopover from './layout-popover';
import { useLayout } from '../block-list/layout';
import useAvailableAlignments from '../block-alignment-control/use-available-alignments';
import { store as blockEditorStore } from '../../store';
import { getValidAlignments } from '../../hooks/align';
import Visualization from './visualization';
import Guides from './guides';

/**
 * A component that displays block alignment guidelines.
 *
 * @param {Object}      props
 * @param {?string[]}   props.allowedAlignments    An optional array of alignments names. By default, the alignment support will be derived from the
 *                                                 'focused' block's block supports, but some blocks (image) have an ad-hoc alignment implementation.
 * @param {string|null} props.layoutClientId       The client id of the block that provides the layout.
 * @param {string}      props.focusedClientId      The client id of the block to show the alignment guides for.
 * @param {?string}     props.highlightedAlignment The alignment name to show the label of.
 */
export default function BlockAlignmentVisualizer( {
	allowedAlignments,
	layoutClientId,
	focusedClientId,
	highlightedAlignment,
} ) {
	const focusedBlockName = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockName( focusedClientId ),
		[ focusedClientId ]
	);

	// Get the valid alignments of the focused block, or use the supplied `allowedAlignments`,
	// which allows this to work for blocks like 'image' that don't use block supports.
	const validAlignments =
		allowedAlignments ??
		getValidAlignments(
			getBlockSupport( focusedBlockName, 'align' ),
			hasBlockSupport( focusedBlockName, 'alignWide', true )
		);
	const availableAlignments = useAvailableAlignments( validAlignments );
	const layout = useLayout();

	if ( availableAlignments?.length === 0 ) {
		return null;
	}

	return (
		<LayoutPopover
			className="block-editor-alignment-visualizer"
			coverClassName="block-editor-alignment-visualizer__cover-element"
			layoutClientId={ layoutClientId }
			focusedClientId={ focusedClientId }
			isConstrained={ layout.type === 'constrained' }
		>
			<ShadowDOMContainer>
				<Visualization
					alignments={ availableAlignments }
					contentSize={ layout.contentSize }
					wideSize={ layout.wideSize }
					justification={ layout.justifyContent }
					highlightedAlignment={ highlightedAlignment }
				/>
				<Guides
					alignments={ availableAlignments }
					contentSize={ layout.contentSize }
					wideSize={ layout.wideSize }
					justification={ layout.justifyContent }
				/>
			</ShadowDOMContainer>
		</LayoutPopover>
	);
}
