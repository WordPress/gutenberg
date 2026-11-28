import { __, _n, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { PluginPrePublishPanel } from '@wordpress/editor';
import CompactList from '../../components/compact-list';
import { store as blockDirectoryStore } from '../../store';

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
			title={ sprintf(
				// translators: %d: number of blocks (number).
				_n(
					'Added: %d block',
					'Added: %d blocks',
					newBlockTypes.length
				),
				newBlockTypes.length
			) }
			initialOpen
		>
			<p className="installed-blocks-pre-publish-panel__copy">
				{ newBlockTypes.length === 1
					? __( 'The following block has been added to your site.' )
					: __(
							'The following blocks have been added to your site.'
						) }
			</p>
			<CompactList items={ newBlockTypes } />
		</PluginPrePublishPanel>
	);
}
