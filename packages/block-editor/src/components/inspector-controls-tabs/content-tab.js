/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockQuickNavigation from '../block-quick-navigation';
import groups from '../inspector-controls/groups';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const ContentTab = ( { contentClientIds } ) => {
	const contentFills = useSlotFills( groups.content?.name );

	const getBlockName = useSelect(
		( select ) => select( blockEditorStore ).getBlockName,
		[]
	);
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const { showBlockAttributeGroup } = unlock(
		useDispatch( blockEditorStore )
	);

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

	const handleSelect = ( clientId ) => {
		const blockName = getBlockName( clientId );
		// Navigation block doesn't have List View block support, but
		// it does have a custom implementation that is shown within
		// patterns, so it's included in this condition.
		if (
			blockName === 'core/navigation' ||
			hasBlockSupport( blockName, 'listView' )
		) {
			showBlockAttributeGroup( 'list' );
		}
	};

	return (
		<>
			{ ! shouldShowBlockFields && (
				<PanelBody
					title={ __( 'Content' ) }
					initialOpen={ initialOpen }
				>
					<BlockQuickNavigation
						clientIds={ contentClientIds }
						onSelect={ handleSelect }
					/>
				</PanelBody>
			) }
		</>
	);
};

export default ContentTab;
