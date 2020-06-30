/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import CompactList from '../../components/compact-list';

export default function InstalledBlocksPrePublishPanel() {
	const newBlockTypes = useSelect(
		( select ) => select( 'core/block-directory' ).getNewBlockTypes(),
		[]
	);

	if ( ! newBlockTypes.length ) {
		return null;
	}

	return (
		<PluginPrePublishPanel
			icon="block-default"
			title={ sprintf(
				// translators: %d: number of blocks (number).
				_n(
					'Added: %d block',
					'Added: %d blocks',
					newBlockTypes.length
				),
				newBlockTypes.length
			) }
			initialOpen={ true }
		>
			<p className="installed-blocks-pre-publish-panel__copy">
				{ _n(
					'The following block has been added to your site.',
					'The following blocks have been added to your site.',
					newBlockTypes.length
				) }
			</p>
			<CompactList items={ newBlockTypes } />
		</PluginPrePublishPanel>
	);
}
