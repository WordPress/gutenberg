/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { compose, useDebounce } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';
import { speak } from '@wordpress/a11y';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import DownloadableBlocksList from '../downloadable-blocks-list';
import { store as blockDirectoryStore } from '../../store';

function DownloadableBlocksPanel( {
	downloadableItems,
	onSelect,
	onHover,
	hasPermission,
	isLoading,
	isWaiting,
} ) {
	const debouncedSpeak = useDebounce( speak, 500 );

	if ( false === hasPermission ) {
		debouncedSpeak( __( 'No blocks found in your library.' ) );
		return (
			<p className="block-directory-downloadable-blocks-panel__description has-no-results">
				{ __( 'No blocks found in your library.' ) }
			</p>
		);
	}

	if ( typeof hasPermission === 'undefined' || isLoading || isWaiting ) {
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
	withSelect( ( select, { filterValue, rootClientId = null } ) => {
		const {
			getDownloadableBlocks,
			isRequestingDownloadableBlocks,
		} = select( blockDirectoryStore );
		const { canInsertBlockType } = select( blockEditorStore );

		const hasPermission = select( coreStore ).canUser(
			'read',
			'block-directory/search'
		);

		function getInstallableBlocks( term ) {
			return getDownloadableBlocks( term ).filter( ( block ) =>
				canInsertBlockType( block, rootClientId, true )
			);
		}

		const downloadableItems = hasPermission
			? getInstallableBlocks( filterValue )
			: [];
		const isLoading = isRequestingDownloadableBlocks( filterValue );

		return {
			downloadableItems,
			hasPermission,
			isLoading,
		};
	} ),
] )( DownloadableBlocksPanel );
