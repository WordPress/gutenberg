import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import BlockQuickNavigation from '../block-quick-navigation';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const ContentTab = ( {
	clientId,
	contentClientIds,
	onSwitchToListView,
	hasListViewTab,
} ) => {
	// The content nested under the groups it belongs to.
	const contentTree = useSelect(
		( select ) =>
			clientId
				? unlock( select( blockEditorStore ) ).getContentTree(
						clientId
					)
				: undefined,
		[ clientId ]
	);

	if ( ! contentClientIds || contentClientIds.length === 0 ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Content' ) }>
			<BlockQuickNavigation
				clientIds={ contentClientIds }
				tree={ contentTree }
				onSwitchToListView={ onSwitchToListView }
				hasListViewTab={ hasListViewTab }
			/>
		</PanelBody>
	);
};

export default ContentTab;
