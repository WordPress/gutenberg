/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';

export const BlockToolbar = ( { blockClientIds, isValid, mode } ) => {
	if ( blockClientIds.length === 0 ) {
		return null;
	}

	return (
		<>
			{ mode === 'visual' && isValid && (
				<>
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
	} = select( 'core/block-editor' );
	const blockClientIds = getSelectedBlockClientIds();

	return {
		blockClientIds,
		isValid: blockClientIds.length === 1 ? isBlockValid( blockClientIds[ 0 ] ) : null,
		mode: blockClientIds.length === 1 ? getBlockMode( blockClientIds[ 0 ] ) : null,
	};
} )( BlockToolbar );
