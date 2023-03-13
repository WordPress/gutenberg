/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { blockDefault } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import CompactList from '../../components/compact-list';
import { store as blockDirectoryStore } from '../../store';

// We shouldn't import the edit-post package directly
// because it would include the wp-edit-post in all pages loading the block-directory script.
const { PluginPrePublishPanel } = window?.wp?.editPost ?? {};

export default function InstalledBlocksPrePublishPanel() {
	const newBlockTypes = useSelect(
		( select ) => select( blockDirectoryStore ).getNewBlockTypes(),
		[]
	);

	if ( ! newBlockTypes.length ) {
		return null;
	}

	return (
		<PluginPrePublishPanel
			icon={ blockDefault }
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
