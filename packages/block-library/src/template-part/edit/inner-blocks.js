/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	InnerBlocks,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	__experimentalBlockContentOverlay as BlockContentOverlay,
	useSetting,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

export default function TemplatePartInnerBlocks( {
	postId: id,
	hasInnerBlocks,
	layout,
	tagName: TagName,
	blockProps,
	clientId,
} ) {
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings()?.supportsLayout;
	}, [] );
	const defaultLayout = useSetting( 'layout' ) || {};
	const usedLayout = !! layout && layout.inherit ? defaultLayout : layout;
	const { contentSize, wideSize } = usedLayout;
	const alignments =
		contentSize || wideSize
			? [ 'wide', 'full' ]
			: [ 'left', 'center', 'right' ];
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_template_part',
		{ id }
	);

	// Use blockProps as the starting point for innerBlockProps to ensure
	// the overlay does not cause style and layout regressions.
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput,
		onChange,
		renderAppender: hasInnerBlocks
			? undefined
			: InnerBlocks.ButtonBlockAppender,
		__experimentalLayout: {
			type: 'default',
			// Find a way to inject this in the support flag code (hooks).
			alignments: themeSupportsLayout ? alignments : undefined,
		},
	} );

	return (
		<TagName { ...blockProps }>
			<BlockContentOverlay clientId={ clientId }>
				{
					// Set tabIndex to remove this from keyboard nav since we have
					// duplicated blockProps into this wrapper.  Otherwise keyboard nav
					// will seem to stay on this block for one extra key press.
					<div { ...innerBlocksProps } tabIndex={ -1 } />
				}
			</BlockContentOverlay>
		</TagName>
	);
}
