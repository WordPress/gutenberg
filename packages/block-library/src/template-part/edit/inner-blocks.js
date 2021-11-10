/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	InnerBlocks,
	useInnerBlocksProps,
	__experimentalBlockContentOverlay as BlockContentOverlay,
	useSetting,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

export default function TemplatePartInnerBlocks( {
	postId: id,
	hasInnerBlocks,
	layout,
	tagName,
	blockProps,
	clientId,
} ) {
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings()?.supportsLayout;
	}, [] );
	const defaultLayout = useSetting( 'layout' ) || {};
	const usedLayout = !! layout && layout.inherit ? defaultLayout : layout;

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_template_part',
		{ id }
	);

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput,
		onChange,
		renderAppender: hasInnerBlocks
			? undefined
			: InnerBlocks.ButtonBlockAppender,
		__experimentalLayout: themeSupportsLayout ? usedLayout : undefined,
	} );

	return (
		<BlockContentOverlay
			clientId={ clientId }
			tagName={ tagName }
			wrapperProps={ innerBlocksProps }
		/>
	);
}
