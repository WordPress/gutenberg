/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

export default function Edit( { attributes, clientId } ) {
	const hasChildBlocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockOrder( clientId ).length > 0,
		[ clientId ]
	);
	const { isActive } = attributes;

	const blockProps = useBlockProps( {
		className: isActive ? 'is-active' : '',
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: hasChildBlocks
			? undefined
			: InnerBlocks.ButtonBlockAppender,
	} );
	return <div { ...innerBlocksProps } role="tabpanel"></div>;
}
