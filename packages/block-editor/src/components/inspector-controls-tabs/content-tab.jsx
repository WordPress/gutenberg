import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import BlockQuickNavigation from '../block-quick-navigation';

const ContentTab = ( {
	contentClientIds,
	onSwitchToListView,
	hasListViewTab,
} ) => {
	if ( ! contentClientIds || contentClientIds.length === 0 ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Content' ) }>
			<BlockQuickNavigation
				clientIds={ contentClientIds }
				onSwitchToListView={ onSwitchToListView }
				hasListViewTab={ hasListViewTab }
			/>
		</PanelBody>
	);
};

export default ContentTab;
