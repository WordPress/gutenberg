/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */

import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';
import BlockSwitcher from '../block-switcher';
import MultiBlocksSwitcher from '../block-switcher/multi-blocks-switcher';
import BlockMover from '../block-mover';

export default function BlockToolbar( { hideDragHandle } ) {
	const {
		blockClientIds,
		isValid,
		mode,
		moverDirection,
		hasMovers = true,
	} = useSelect( ( select ) => {
		const {
			getBlockMode,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockRootClientId,
			getBlockListSettings,
		} = select( 'core/block-editor' );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const blockRootClientId = getBlockRootClientId(
			selectedBlockClientIds[ 0 ]
		);

		const { __experimentalMoverDirection, __experimentalUIParts = {} } =
			getBlockListSettings( blockRootClientId ) || {};

		return {
			blockClientIds: selectedBlockClientIds,
			rootClientId: blockRootClientId,
			isValid:
				selectedBlockClientIds.length === 1
					? isBlockValid( selectedBlockClientIds[ 0 ] )
					: null,
			mode:
				selectedBlockClientIds.length === 1
					? getBlockMode( selectedBlockClientIds[ 0 ] )
					: null,
			moverDirection: __experimentalMoverDirection,
			hasMovers: __experimentalUIParts.hasMovers,
		};
	}, [] );

	if ( blockClientIds.length === 0 ) {
		return null;
	}

	if ( blockClientIds.length > 1 ) {
		return (
			<div className="block-editor-block-toolbar">
				{ hasMovers && (
					<BlockMover
						clientIds={ blockClientIds }
						__experimentalOrientation={ moverDirection }
						hideDragHandle={ hideDragHandle }
					/>
				) }
				<MultiBlocksSwitcher />
				<BlockSettingsMenu clientIds={ blockClientIds } />
			</div>
		);
	}

	return (
		<div className="block-editor-block-toolbar">
			{ hasMovers && (
				<BlockMover
					clientIds={ blockClientIds }
					__experimentalOrientation={ moverDirection }
					hideDragHandle={ hideDragHandle }
				/>
			) }
			{ mode === 'visual' && isValid && (
				<>
					<BlockSwitcher clientIds={ blockClientIds } />
					<BlockControls.Slot
						bubblesVirtually
						className="block-editor-block-toolbar__slot"
					/>
					<BlockFormatControls.Slot
						bubblesVirtually
						className="block-editor-block-toolbar__slot"
					/>
				</>
			) }
			<BlockSettingsMenu clientIds={ blockClientIds } />
		</div>
	);
}
