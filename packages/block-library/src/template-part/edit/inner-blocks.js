/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	InnerBlocks,
	useInnerBlocksProps,
	useSettings,
	store as blockEditorStore,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

function useRenderAppender( hasInnerBlocks ) {
	const blockEditingMode = useBlockEditingMode();
	// Disable appending when the editing mode is 'contentOnly'. This is so that the user can't
	// append into a template part when editing a page in the site editor. See
	// DisableNonPageContentBlocks. Ideally instead of (mis)using editing mode there would be a
	// block editor API for achieving this.
	if ( blockEditingMode === 'contentOnly' ) {
		return false;
	}
	if ( ! hasInnerBlocks ) {
		return InnerBlocks.ButtonBlockAppender;
	}
}

function useLayout( layout ) {
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings()?.supportsLayout;
	}, [] );
	const [ defaultLayout ] = useSettings( 'layout' );
	if ( themeSupportsLayout ) {
		return layout?.inherit ? defaultLayout || {} : layout;
	}
}

export default function TemplatePartInnerBlocks( {
	postId: id,
	hasInnerBlocks,
	layout,
	tagName: TagName,
	blockProps,
} ) {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_template_part',
		{ id }
	);

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput,
		onChange,
		renderAppender: useRenderAppender( hasInnerBlocks ),
		layout: useLayout( layout ),
	} );

	return <TagName { ...innerBlocksProps } />;
}
