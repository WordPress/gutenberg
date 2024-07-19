/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

export default function Edit( { clientId, context } ) {
	const isActive = context[ 'tabs/activeTab' ] === clientId;
	const blockProps = useBlockProps( {
		className: isActive ? 'is-active' : '',
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: InnerBlocks.ButtonBlockAppender,
	} );
	return <div { ...innerBlocksProps } role="tabpanel"></div>;
}
