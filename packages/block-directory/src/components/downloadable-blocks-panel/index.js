/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import DownloadableBlocksList from '../downloadable-blocks-list';
import DownloadableBlocksInserterPanel from './inserter-panel';
import DownloadableBlocksNoResults from './no-results';
import { store as blockDirectoryStore } from '../../store';

const EMPTY_ARRAY = [];

const useDownloadableBlocks = ( filterValue ) =>
	useSelect(
		( select ) => {
			const {
				getDownloadableBlocks,
				isRequestingDownloadableBlocks,
				getInstalledBlockTypes,
			} = select( blockDirectoryStore );

			const hasPermission = select( coreStore ).canUser(
				'read',
				'block-directory/search'
			);

			let downloadableBlocks = EMPTY_ARRAY;
			if ( hasPermission ) {
				downloadableBlocks = getDownloadableBlocks( filterValue );

				// Filter out blocks that are already installed.
				const installedBlockTypes = getInstalledBlockTypes();
				const installableBlocks = downloadableBlocks.filter(
					( { name } ) => {
						// Check if the block has just been installed, in which case it
						// should still show in the list to avoid suddenly disappearing.
						// `installedBlockTypes` only returns blocks stored in state
						// immediately after installation, not all installed blocks.
						const isJustInstalled = installedBlockTypes.some(
							( blockType ) => blockType.name === name
						);
						const isPreviouslyInstalled = getBlockType( name );
						return isJustInstalled || ! isPreviouslyInstalled;
					}
				);

				// Keep identity of the `downloadableBlocks` array if nothing was filtered out
				if ( installableBlocks.length !== downloadableBlocks.length ) {
					downloadableBlocks = installableBlocks;
				}

				// Return identical empty array when there are no blocks
				if ( downloadableBlocks.length === 0 ) {
					downloadableBlocks = EMPTY_ARRAY;
				}
			}

			return {
				hasPermission,
				downloadableBlocks,
				isLoading: isRequestingDownloadableBlocks( filterValue ),
			};
		},
		[ filterValue ]
	);

export default function DownloadableBlocksPanel( {
	onSelect,
	onHover,
	hasLocalBlocks,
	isTyping,
	filterValue,
} ) {
	const { hasPermission, downloadableBlocks, isLoading } =
		useDownloadableBlocks( filterValue );

	if ( hasPermission === undefined || isLoading || isTyping ) {
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

	if ( downloadableBlocks.length === 0 ) {
		return hasLocalBlocks ? null : <DownloadableBlocksNoResults />;
	}

	return (
		<DownloadableBlocksInserterPanel
			downloadableItems={ downloadableBlocks }
			hasLocalBlocks={ hasLocalBlocks }
		>
			<DownloadableBlocksList
				items={ downloadableBlocks }
				onSelect={ onSelect }
				onHover={ onHover }
			/>
		</DownloadableBlocksInserterPanel>
	);
}
