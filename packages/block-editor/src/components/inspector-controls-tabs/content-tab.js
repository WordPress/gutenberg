/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockQuickNavigation from '../block-quick-navigation';
import ContentOnlyControls from '../content-only-controls';

const ContentTab = ( { rootClientId, contentClientIds } ) => {
	if ( ! contentClientIds || contentClientIds.length === 0 ) {
		return null;
	}

	return (
		<>
			{ ! window?.__experimentalContentOnlyPatternInsertion && (
				<PanelBody title={ __( 'Content' ) }>
					<BlockQuickNavigation clientIds={ contentClientIds } />
				</PanelBody>
			) }
			{ window?.__experimentalContentOnlyPatternInsertion && (
				<ContentOnlyControls rootClientId={ rootClientId } />
			) }
		</>
	);
};

export default ContentTab;
