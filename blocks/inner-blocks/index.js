/**
 * WordPress dependencies
 */
import { withContext } from '@wordpress/components';

function InnerBlocks( { BlockList, layouts, allowedBlocks, template } ) {
	return <BlockList { ...{ layouts, allowedBlocks, template } } />;
}

InnerBlocks = withContext( 'BlockList' )()( InnerBlocks );

InnerBlocks.Content = ( { BlockContent } ) => {
	return <BlockContent />;
};

InnerBlocks.Content = withContext( 'BlockContent' )()( InnerBlocks.Content );

export default InnerBlocks;
