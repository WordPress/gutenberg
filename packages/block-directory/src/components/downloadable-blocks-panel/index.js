/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { withSelect } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import DownloadableBlocksList from '../downloadable-blocks-list';
import DownloadableBlocksInserterPanel from './inserter-panel';
import DownloadableBlocksNoResults from './no-results';
import { store as blockDirectoryStore } from '../../store';

const EMPTY_ARRAY = [];

function DownloadableBlocksPanel( {
	downloadableItems,
	onSelect,
	onHover,
	hasLocalBlocks,
	hasPermission,
	isLoading,
	isTyping,
} ) {
	if ( typeof hasPermission === 'undefined' || isLoading || isTyping ) {
		return (
			<>
				{ hasPermission && ! hasLocalBlocks && (
					<>
						<p className="block-directory-downloadable-blocks-panel__no-local">
							{ __(
								'No results available from your installed blocks.'
							) }
						</p>
						<div className="block-editor-inserter__quick-inserter-separator" />
					</>
				) }
				<div className="block-directory-downloadable-blocks-panel has-blocks-loading">
					<Spinner />
				</div>
			</>
		);
	}

	if ( false === hasPermission ) {
		if ( ! hasLocalBlocks ) {
			return <DownloadableBlocksNoResults />;
		}

		return null;
	}

	return !! downloadableItems.length ? (
		<DownloadableBlocksInserterPanel
			downloadableItems={ downloadableItems }
			hasLocalBlocks={ hasLocalBlocks }
		>
			<DownloadableBlocksList
				items={ downloadableItems }
				onSelect={ onSelect }
				onHover={ onHover }
			/>
		</DownloadableBlocksInserterPanel>
	) : (
		! hasLocalBlocks && <DownloadableBlocksNoResults />
	);
}

export default compose( [
	withSelect( ( select, { filterValue } ) => {
		const {
			getDownloadableBlocks,
			isRequestingDownloadableBlocks,
			getInstalledBlockTypes,
		} = select( blockDirectoryStore );

		const hasPermission = select( coreStore ).canUser(
			'read',
			'block-directory/search'
		);

		function getInstallableBlocks( term ) {
			const downloadableBlocks = getDownloadableBlocks( term );
			const installedBlockTypes = getInstalledBlockTypes();
			// Filter out blocks that are already installed.
			const installableBlocks = downloadableBlocks.filter( ( block ) => {
				// Check if the block has just been installed, in which case it
				// should still show in the list to avoid suddenly disappearing.
				// `installedBlockTypes` only returns blocks stored in state
				// immediately after installation, not all installed blocks.
				const isJustInstalled = !! installedBlockTypes.find(
					( blockType ) => blockType.name === block.name
				);
				const isPreviouslyInstalled = getBlockType( block.name );
				return isJustInstalled || ! isPreviouslyInstalled;
			} );

			if ( downloadableBlocks.length === installableBlocks.length ) {
				return downloadableBlocks;
			}
			return installableBlocks;
		}

		let downloadableItems = hasPermission
			? getInstallableBlocks( filterValue )
			: [];

		if ( downloadableItems.length === 0 ) {
			downloadableItems = EMPTY_ARRAY;
		}

		const isLoading = isRequestingDownloadableBlocks( filterValue );

		return {
			downloadableItems,
			hasPermission,
			isLoading,
		};
	} ),
] )( DownloadableBlocksPanel );
