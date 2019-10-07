/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';

/**
 * Internal dependencies
 */
import UngroupButton from '../ungroup-button';

export const BlockToolbar = ( { blockClientIds, isValid, mode, isSelectedGroup } ) => {
	if ( blockClientIds.length === 0 ) {
		return null;
	}

	return (
		<>
			{ mode === 'visual' && isValid && (
				<>
					{ isSelectedGroup && <UngroupButton /> }
					<BlockControls.Slot />
					<BlockFormatControls.Slot />
				</>
			) }
		</>
	);
};

export default withSelect( ( select ) => {
	const {
		getBlockMode,
		getSelectedBlockClientIds,
		isBlockValid,
		getSelectedBlock,
	} = select( 'core/block-editor' );
	const blockClientIds = getSelectedBlockClientIds();
	const selectedBlock = getSelectedBlock();
	const isSelectedGroup = selectedBlock && selectedBlock.name === 'core/group';

	return {
		blockClientIds,
		isValid: blockClientIds.length === 1 ? isBlockValid( blockClientIds[ 0 ] ) : null,
		mode: blockClientIds.length === 1 ? getBlockMode( blockClientIds[ 0 ] ) : null,
		isSelectedGroup,
	};
} )( BlockToolbar );
