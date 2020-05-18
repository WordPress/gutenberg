/**
 * External dependencies
 */
import { differenceBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

// eslint-disable-next-line import/no-extraneous-dependencies
import { PluginPrePublishPanel } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import DownloadableBlockCompactList from '../../components/downloadable-block-compact-list';

const DownloadableBlockPrePublishPanel = ( {
	usedNewBlocks,
	unusedNewBlocks,
} ) => {
	if ( ! usedNewBlocks.length ) {
		return null;
	}

	return (
		<PluginPrePublishPanel
			title={ sprintf(
				// translators: %d: number of blocks (number).
				_n(
					'Added: %d block',
					'Added: %d blocks',
					usedNewBlocks.length
				),
				usedNewBlocks.length
			) }
			initialOpen={ true }
		>
			<p className="downloadable-block-pre-publish-panel__copy">
				{ __( 'The following blocks have been added to your site:' ) }
			</p>
			<DownloadableBlockCompactList items={ usedNewBlocks } />
			{ unusedNewBlocks.length > 0 && (
				<p className="downloadable-block-pre-publish-panel__subcopy">
					{ sprintf(
						// translators: %d: number of unused blocks (number).
						_n(
							'Removing %d unused block',
							'Removing %d unused blocks',
							unusedNewBlocks.length
						),
						unusedNewBlocks.length
					) }
				</p>
			) }
		</PluginPrePublishPanel>
	);
};

export default compose( [
	withSelect( ( select ) => {
		const { getInstalledBlockTypes } = select( 'core/block-directory' );
		const { getBlocks } = select( 'core/block-editor' );

		const installedBlocks = getInstalledBlockTypes();
		const blockToUninstall = differenceBy(
			installedBlocks,
			getBlocks(),
			'name'
		);

		return {
			usedNewBlocks: differenceBy(
				installedBlocks,
				blockToUninstall,
				'name'
			),
			unusedNewBlocks: blockToUninstall,
		};
	} ),
] )( DownloadableBlockPrePublishPanel );
