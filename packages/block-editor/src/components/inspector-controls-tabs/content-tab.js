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

const ContentTab = ( { contentClientIds } ) => {
	if ( ! contentClientIds || contentClientIds.length === 0 ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Content' ) }>
			<>
				{ ! window?.__experimentalContentOnlyPatternInsertion && (
					<PanelBody title={ __( 'Content' ) }>
						<BlockQuickNavigation clientIds={ contentClientIds } />
					</PanelBody>
				) }
				{ window?.__experimentalContentOnlyPatternInsertion && (
					<ContentOnlyControls clientIds={ contentClientIds } />
				) }
			</>
		</PanelBody>
	);
};

export default ContentTab;
