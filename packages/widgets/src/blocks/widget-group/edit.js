/**
 * WordPress dependencies
 */
import {
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
	RichText,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

export default function Edit( {
	attributes,
	setAttributes,
	clientId,
	onReplace,
	mergeBlocks,
} ) {
	const { getBlock } = useSelect( blockEditorStore );
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	const { innerBlocks } = getBlock( clientId );

	const innerBlocksProps = useInnerBlocksProps( {
		className: 'wp-widget-group-blocks',
	} );

	const blockProps = useBlockProps();

	/**
	 * Split RichText on ENTER by manually creating a new paragraph block
	 * within the innerBlocks of the **existing** Widget Group block.
	 * If we don't do this then RichText will be split into heading + para
	 * thereby entirely removint the Widget Group block altogether.
	 */
	function allowSingleLineOnly() {
		replaceInnerBlocks(
			clientId,
			[ createBlock( 'core/paragraph', {} ), ...innerBlocks ],
			true
		);
	}

	return (
		<div { ...blockProps }>
			<RichText
				identifier="content"
				className="widget-title"
				tagName="h2"
				aria-label={ __( 'Widget title' ) }
				placeholder={ __( 'Add title' ) }
				value={ attributes.title }
				onChange={ ( value ) => setAttributes( { title: value } ) }
				onReplace={ onReplace }
				onMerge={ mergeBlocks }
				onSplit={ allowSingleLineOnly }
				onRemove={ () => onReplace( [] ) }
				{ ...blockProps }
			/>
			<div { ...innerBlocksProps } />
		</div>
	);
}
