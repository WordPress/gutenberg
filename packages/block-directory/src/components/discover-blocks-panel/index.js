/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import DiscoverBlocksList from '../discover-blocks-list';

function DiscoverBlocksPanel( { discoverItems, onSelect, onHover, hasPermission, isLoading } ) {
	if ( isLoading ) {
		return (
			<p className="block-editor-discover-blocks-panel__description has-no-results">
				<Spinner />
			</p>
		);
	}

	if ( ! hasPermission ) {
		return (
			<p className="block-editor-discover-blocks-panel__description has-no-results">
				{ __( 'No blocks found in your library.' ) }
				<br />
				{ __( 'Please contact your site administrator to install new blocks.' ) }
			</p>
		);
	}

	if ( ! discoverItems.length ) {
		return (
			<p className="block-editor-discover-blocks-panel__description has-no-results">
				{ __( 'No blocks found in your library.' ) }
			</p>
		);
	}

	return (
		<Fragment>
			<p className="block-editor-discover-blocks-panel__description">
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
			hasInstallBlocksPermission,
			isRequestingDiscoverBlocks,
		} = select( 'core/block-directory' );

		const discoverItems = getDiscoverBlocks( filterValue );
		const hasPermission = hasInstallBlocksPermission();
		const isLoading = isRequestingDiscoverBlocks();

		return {
			discoverItems,
			hasPermission,
			isLoading,
		};
	} ),
] )( DiscoverBlocksPanel );
