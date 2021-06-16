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
import { useMemo } from '@wordpress/element';

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
	const _layout = useMemo( () => {
		if ( themeSupportsLayout ) {
			const alignments =
				contentSize || wideSize
					? [ 'wide', 'full' ]
					: [ 'left', 'center', 'right' ];
			return {
				type: 'default',
				// Find a way to inject this in the support flag code (hooks).
				alignments,
			};
		}
		return undefined;
	}, [ themeSupportsLayout, contentSize, wideSize ] );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_template_part',
		{ id }
	);

	const { className, 'data-type': dataType, style } = blockProps;
	// Use classnames, common selectors, and style from blockProps in the
	// innerBlockProps to ensure the overlay does not cause style and layout regressions.
	const innerBlocksProps = useInnerBlocksProps(
		{
			className,
			'data-type': dataType,
			style,
		},
		{
			value: blocks,
			onInput,
			onChange,
			renderAppender: hasInnerBlocks
				? undefined
				: InnerBlocks.ButtonBlockAppender,
			__experimentalLayout: _layout,
		}
	);

	return (
		<TagName { ...blockProps }>
			<BlockContentOverlay clientId={ clientId }>
				<div { ...innerBlocksProps } />
			</BlockContentOverlay>
		</TagName>
	);
}
