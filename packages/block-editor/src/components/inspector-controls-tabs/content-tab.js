/**
 * WordPress dependencies
 */
import { PanelBody, createSlotFill } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockQuickNavigation from '../block-quick-navigation';

const { Fill: BlockFieldsFill, Slot: BlockFieldsSlot } =
	createSlotFill( 'BlockFields' );

export { BlockFieldsFill };

const ContentTab = ( { contentClientIds } ) => {
	if ( ! contentClientIds || contentClientIds.length === 0 ) {
		return null;
	}

	const shouldShowBlockFields =
		window?.__experimentalContentOnlyPatternInsertion &&
		window?.__experimentalContentOnlyInspectorFields;

	return (
		<>
			{ ! shouldShowBlockFields && (
				<PanelBody title={ __( 'Content' ) }>
					<BlockQuickNavigation clientIds={ contentClientIds } />
				</PanelBody>
			) }
			{ shouldShowBlockFields && <BlockFieldsSlot bubblesVirtually /> }
		</>
	);
};

export default ContentTab;
