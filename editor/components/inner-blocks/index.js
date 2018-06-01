/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withContext } from '@wordpress/components';
import { withViewportMatch } from '@wordpress/viewport';
import { compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';

function InnerBlocks( {
	BlockList,
	layouts,
	allowedBlocks,
	template,
	isSmallScreen,
	isSelectedBlockInRoot,
} ) {
	const classes = classnames( 'editor-inner-blocks', {
		'has-overlay': isSmallScreen && ! isSelectedBlockInRoot,
	} );

	return (
		<div className={ classes }>
			<BlockList { ...{ layouts, allowedBlocks, template } } />
		</div>
	);
}

InnerBlocks = compose( [
	withContext( 'BlockList' )(),
	withContext( 'uid' )(),
	withViewportMatch( { isSmallScreen: '< medium' } ),
	withSelect( ( select, ownProps ) => {
		const { isBlockSelected, hasSelectedInnerBlock } = select( 'core/editor' );
		const { uid } = ownProps;

		return {
			isSelectedBlockInRoot: isBlockSelected( uid ) || hasSelectedInnerBlock( uid ),
		};
	} ),
] )( InnerBlocks );

InnerBlocks.Content = ( { BlockContent } ) => {
	return <BlockContent />;
};

InnerBlocks.Content = withContext( 'BlockContent' )()( InnerBlocks.Content );

export default InnerBlocks;
