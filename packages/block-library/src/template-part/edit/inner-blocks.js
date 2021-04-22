/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	InnerBlocks,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	__experimentalUseEditorFeature as useEditorFeature,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ContentLock from './content-lock';

export default function TemplatePartInnerBlocks( {
	postId: id,
	hasInnerBlocks,
	layout,
	tagName: TagName,
	blockProps,
	isSelected,
} ) {
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings()?.supportsLayout;
	}, [] );
	const defaultLayout = useEditorFeature( 'layout' ) || {};
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

	// const [ isHovered, setIsHovered ] = useState( false );
	// const {
	// 	hideInsertionPointPopover,
	// 	showInsertionPointPopover,
	// } = useDispatch( blockEditorStore );

	// useEffect( () => {
	// 	if ( isHovered && ! isSelected ) {
	// 		hideInsertionPointPopover();
	// 	} else {
	// 		showInsertionPointPopover();
	// 	}
	// }, [ isSelected, isHovered ] );

	return (
		<ContentLock
		// onMouseEnter={ () => setIsHovered( true ) }
		// onMouseLeave={ () => setIsHovered( false ) }
		>
			<TagName { ...innerBlocksProps } />
		</ContentLock>
	);
}
