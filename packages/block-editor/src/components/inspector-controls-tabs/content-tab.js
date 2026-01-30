/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockQuickNavigation from '../block-quick-navigation';
import groups from '../inspector-controls/groups';

const ContentTab = ( { contentClientIds } ) => {
	const contentFills = useSlotFills( groups.content?.name );

	if ( ! contentClientIds || contentClientIds.length === 0 ) {
		return null;
	}

	// If there are other panels rendering in the content tab using fills,
	// collapse the content panel to make space.
	const hasContentFills = Boolean( contentFills && contentFills.length );

	const shouldShowBlockFields =
		window?.__experimentalContentOnlyInspectorFields;

	// Collapse the Content panel when there are fills in the content group.
	const initialOpen = ! hasContentFills;

	return (
		<>
			{ ! shouldShowBlockFields && (
				<PanelBody
					title={ __( 'Content' ) }
					initialOpen={ initialOpen }
				>
					<BlockQuickNavigation clientIds={ contentClientIds } />
				</PanelBody>
			) }
		</>
	);
};

export default ContentTab;
