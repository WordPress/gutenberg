/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockQuickNavigation from '../block-quick-navigation';

const ContentTab = ( { contentClientIds } ) => {
	if ( ! contentClientIds || contentClientIds.length === 0 ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Content' ) }>
			<BlockQuickNavigation clientIds={ contentClientIds } />
		</PanelBody>
	);
};

export default ContentTab;
