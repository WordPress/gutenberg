/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockSwitcher from '../block-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';

export default function BlockToolbar( { hasMovers = true } ) {
	const {
		blockClientIds,
		isValid,
		mode,
		moverDirection,
	} = useSelect( ( select ) => {
		const {
			getBlockMode,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockRootClientId,
			getBlockListSettings,
		} = select( 'core/block-editor' );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const blockRootClientId = getBlockRootClientId( selectedBlockClientIds[ 0 ] );

		const {
			__experimentalMoverDirection,
		} = getBlockListSettings( blockRootClientId ) || {};

		return {
			blockClientIds: selectedBlockClientIds,
			rootClientId: blockRootClientId,
			isValid: selectedBlockClientIds.length === 1 ?
				isBlockValid( selectedBlockClientIds[ 0 ] ) :
				null,
			mode: selectedBlockClientIds.length === 1 ?
				getBlockMode( selectedBlockClientIds[ 0 ] ) :
				null,
			moverDirection: __experimentalMoverDirection,
		};
	}, [] );

	if ( blockClientIds.length === 0 ) {
		return null;
	}

	const shouldShowVisualToolbar = isValid && mode === 'visual';
	const isMultiToolbar = blockClientIds.length > 1;

	return (
		<div className="block-editor-block-toolbar">
			{ hasMovers && ( <BlockMover
				clientIds={ blockClientIds }
				__experimentalOrientation={ moverDirection }
			/> ) }
			{ ( shouldShowVisualToolbar || isMultiToolbar ) && <BlockSwitcher clientIds={ blockClientIds } /> }
			{ shouldShowVisualToolbar && ! isMultiToolbar && (
				<>
					<BlockControls.Slot bubblesVirtually className="block-editor-block-toolbar__slot" />
					<BlockFormatControls.Slot bubblesVirtually className="block-editor-block-toolbar__slot" />
				</>
			) }
			<BlockSettingsMenu clientIds={ blockClientIds } />
		</div>
	);
}
