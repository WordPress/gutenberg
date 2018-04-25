/**
 * WordPress dependencies
 */
import { withContext } from '@wordpress/components';

function InnerBlocks( { BlockList, layouts } ) {
	return BlockList ? <BlockList layouts={ layouts } /> : null;
}

InnerBlocks = withContext( 'BlockList' )()( InnerBlocks );

InnerBlocks.Content = ( { BlockContent } ) => {
	return BlockContent ? <BlockContent /> : null;
};

InnerBlocks.Content = withContext( 'BlockContent' )()( InnerBlocks.Content );

export default InnerBlocks;
