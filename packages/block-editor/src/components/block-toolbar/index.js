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
import BlockPopover from '../block-list/block-popover';
import BlockBreadcrumb from '../block-list/breadcrumb';

export default function BlockToolbarWrapper( { contextual } ) {
	if ( contextual ) {
		return <BlockPopover />;
	}

	return <BlockToolbar />;
}

export function BlockToolbar() {
	function selector( select ) {
		const {
			getBlockMode,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockRootClientId,
			getBlockListSettings,
			isNavigationMode,
		} = select( 'core/block-editor' );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const blockRootClientId = getBlockRootClientId( selectedBlockClientIds[ 0 ] );
		const {
			__experimentalMoverDirection,
			__experimentalUIParts = {},
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
			hasMovers: __experimentalUIParts.hasMovers,
			isNavigationMode: isNavigationMode(),
		};
	}

	const {
		blockClientIds,
		isValid,
		mode,
		moverDirection,
		hasMovers = true,
		isNavigationMode,
	} = useSelect( selector, [] );

	if ( blockClientIds.length === 0 ) {
		return null;
	}

	if ( blockClientIds.length > 1 ) {
		return (
			<div className="block-editor-block-toolbar">
				{ hasMovers && ( <BlockMover
					clientIds={ blockClientIds }
					__experimentalOrientation={ moverDirection }
				/> ) }
				<MultiBlocksSwitcher />
				<BlockSettingsMenu clientIds={ blockClientIds } />
			</div>
		);
	}

	if ( isNavigationMode ) {
		return (
			<BlockBreadcrumb
				clientId={ blockClientIds[ 0 ] }
				// data-align={ align }
			/>
		);
	}

	return (
		<div className="block-editor-block-toolbar">
			{ hasMovers && ( <BlockMover
				clientIds={ blockClientIds }
				__experimentalOrientation={ moverDirection }
			/> ) }
			{ mode === 'visual' && isValid && (
				<>
					<BlockSwitcher clientIds={ blockClientIds } />
					<BlockControls.Slot bubblesVirtually className="block-editor-block-toolbar__slot" />
					<BlockFormatControls.Slot bubblesVirtually className="block-editor-block-toolbar__slot" />
				</>
			) }
			<BlockSettingsMenu clientIds={ blockClientIds } />
		</div>
	);
}
