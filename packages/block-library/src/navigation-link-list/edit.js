/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	BlockControls,
	InspectorControls,
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

const ALLOWED_BLOCKS = [ 'core/navigation-link', 'core/spacer' ];

export default function NavigationLinksEdit( { clientId, isSelected } ) {
	const {
		isImmediateParentOfSelectedBlock,
		selectedBlockHasDescendants,
	} = useSelect(
		( select ) => {
			const {
				getClientIdsOfDescendants,
				hasSelectedInnerBlock,
				getSelectedBlockClientId,
			} = select( blockEditorStore );
			const selectedBlockId = getSelectedBlockClientId();
			return {
				isImmediateParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					false
				),
				selectedBlockHasDescendants: !! getClientIdsOfDescendants( [
					selectedBlockId,
				] )?.length,
			};
		},
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		className: 'wp-block-navigation__container',
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		renderAppender:
			( isImmediateParentOfSelectedBlock &&
				! selectedBlockHasDescendants ) ||
			isSelected
				? InnerBlocks.DefaultAppender
				: false,
		__experimentalAppenderTagName: 'li',
		__experimentalCaptureToolbars: true,
		__experimentalLayout: {
			type: 'default',
			alignments: [],
		},
	} );

	return (
		<>
			<BlockControls />
			<InspectorControls />
			<ul { ...innerBlocksProps } />
		</>
	);
}
