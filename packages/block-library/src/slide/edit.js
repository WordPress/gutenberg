/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InnerBlocks,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

function SlideEdit( { clientId, isSelected } ) {
	const hasInnerBlocksSelected = useSelect(
		( select ) =>
			select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId ]
	);

	const isActiveSlide = isSelected || hasInnerBlocksSelected;

	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-slide', {
			'is-selected-slide': isActiveSlide,
		} ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: isActiveSlide ? InnerBlocks.ButtonBlockAppender : false,
	} );

	return <div { ...innerBlocksProps } />;
}

export default SlideEdit;
