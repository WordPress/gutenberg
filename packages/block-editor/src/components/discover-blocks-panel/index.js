/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DiscoverBlocksList from '../discover-blocks-list';

function DiscoverBlocksPanel( { discoverItems, onSelect, onHover } ) {
	return (
		<Fragment>
			<p className="editor-inserter__no-results-with-discover-items block-editor-inserter__no-results-with-discover-items">
				{ __( 'No blocks found in your library. We did find these blocks available for download:' ) }
			</p>
			<DiscoverBlocksList items={ discoverItems } onSelect={ onSelect } onHover={ onHover } />
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select, { filterValue } ) => {
		const {
			getDiscoverBlocks,
		} = select( 'core/block-editor' );

		const discoverItems = getDiscoverBlocks( filterValue );

		return {
			discoverItems,
		};
	} ),
] )( DiscoverBlocksPanel );
