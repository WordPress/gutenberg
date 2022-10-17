/**
 * WordPress dependencies
 */
import { __experimentalUseSlotFills as useSlotFills } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../inspector-controls';
import InspectorControlsGroups from '../inspector-controls/groups';

// This tab restricts the blocks that may render to it via the whitelist below.
const whitelist = [ 'core/navigation' ];

export const useIsListViewDisabled = ( blockName ) => {
	return ! whitelist.includes( blockName );
};

const ListViewTab = ( { blockName, hasSingleBlockSelection } ) => {
	const { list } = InspectorControlsGroups;
	const fills = useSlotFills( list.Slot.__unstableName ) || [];

	// Unlike other tabs the List View is much more niche. As such it will be
	// omitted if the current block isn't in the whitelist.
	if ( useIsListViewDisabled( blockName ) ) {
		return;
	}

	return (
		<>
			{ ! fills.length && (
				<span className="block-editor-block-inspector__no-block-tools">
					{ hasSingleBlockSelection
						? __( 'This block has no list options.' )
						: __( 'The selected blocks have no list options.' ) }
				</span>
			) }
			<InspectorControls.Slot __experimentalGroup="list" />
		</>
	);
};

export default ListViewTab;
