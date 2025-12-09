/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockQuickNavigation from '../block-quick-navigation';
import { BlockFieldsSlot } from '../content-only-controls';

const ContentTab = ( { contentClientIds } ) => {
	if ( ! contentClientIds || contentClientIds.length === 0 ) {
		return null;
	}

	const shouldShowContentOnlyControls =
		window?.__experimentalContentOnlyPatternInsertion &&
		window?.__experimentalContentOnlyInspectorFields;

	return (
		<>
			{ ! shouldShowContentOnlyControls && (
				<PanelBody title={ __( 'Content' ) }>
					<BlockQuickNavigation clientIds={ contentClientIds } />
				</PanelBody>
			) }
			{ shouldShowContentOnlyControls && <BlockFieldsSlot /> }
		</>
	);
};

export default ContentTab;
