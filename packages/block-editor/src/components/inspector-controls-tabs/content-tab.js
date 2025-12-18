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
import InspectorControls from '../inspector-controls';

const ContentTab = ( { rootClientId, contentClientIds } ) => {
	const hasContentClientIds = contentClientIds && contentClientIds.length > 0;

	const shouldShowContentOnlyControls =
		hasContentClientIds &&
		window?.__experimentalContentOnlyPatternInsertion &&
		window?.__experimentalContentOnlyInspectorFields;

	return (
		<>
			{ hasContentClientIds && ! shouldShowContentOnlyControls && (
				<PanelBody title={ __( 'Content' ) }>
					<BlockQuickNavigation clientIds={ contentClientIds } />
				</PanelBody>
			) }
			{ shouldShowContentOnlyControls && (
				<ContentOnlyControls rootClientId={ rootClientId } />
			) }
			<InspectorControls.Slot group="content" />
		</>
	);
};

export default ContentTab;
