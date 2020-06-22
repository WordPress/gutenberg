/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Spinner, withSpokenMessages } from '@wordpress/components';

/**
 * Internal dependencies
 */
import DownloadableBlocksList from '../downloadable-blocks-list';

function DownloadableBlocksPanel( {
	downloadableItems,
	onSelect,
	onHover,
	hasPermission,
	isLoading,
	isWaiting,
	debouncedSpeak,
} ) {
	if ( ! hasPermission ) {
		debouncedSpeak(
			__(
				'No blocks found in your library. Please contact your site administrator to install new blocks.'
			)
		);
		return (
			<p className="block-directory-downloadable-blocks-panel__description has-no-results">
				{ __( 'No blocks found in your library.' ) }
				<br />
				{ __(
					'Please contact your site administrator to install new blocks.'
				) }
			</p>
		);
	}

	if ( isLoading || isWaiting ) {
		return (
			<p className="block-directory-downloadable-blocks-panel__description has-no-results">
				<Spinner />
			</p>
		);
	}

	if ( ! downloadableItems.length ) {
		return (
			<p className="block-directory-downloadable-blocks-panel__description has-no-results">
				{ __( 'No blocks found in your library.' ) }
			</p>
		);
	}

	const resultsFoundMessage = sprintf(
		/* translators: %s: number of available blocks. */
		_n(
			'No blocks found in your library. We did find %d block available for download.',
			'No blocks found in your library. We did find %d blocks available for download.',
			downloadableItems.length
		),
		downloadableItems.length
	);

	debouncedSpeak( resultsFoundMessage );
	return (
		<Fragment>
			<p className="block-directory-downloadable-blocks-panel__description">
				{ __(
					'No blocks found in your library. These blocks can be downloaded and installed:'
				) }
			</p>
			<DownloadableBlocksList
				items={ downloadableItems }
				onSelect={ onSelect }
				onHover={ onHover }
			/>
		</Fragment>
	);
}

export default compose( [
	withSpokenMessages,
	withSelect( ( select, { filterValue } ) => {
		const {
			getDownloadableBlocks,
			hasInstallBlocksPermission,
			isRequestingDownloadableBlocks,
		} = select( 'core/block-directory' );

		const hasPermission = hasInstallBlocksPermission();
		const downloadableItems = hasPermission
			? getDownloadableBlocks( filterValue )
			: [];
		const isLoading = isRequestingDownloadableBlocks( filterValue );

		return {
			downloadableItems,
			hasPermission,
			isLoading,
		};
	} ),
] )( DownloadableBlocksPanel );
