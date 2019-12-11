/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */

import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockMobileToolbar from '../block-mobile-toolbar';
import BlockSettingsMenu from '../block-settings-menu';
import BlockSwitcher from '../block-switcher';
import MultiBlocksSwitcher from '../block-switcher/multi-blocks-switcher';

export default function BlockToolbar() {
	const { blockClientIds, isValid, mode } = useSelect( ( select ) => {
		const {
			getBlockMode,
			getSelectedBlockClientIds,
			isBlockValid,
		} = select( 'core/block-editor' );
		const selectedBlockClientIds = getSelectedBlockClientIds();

		return {
			blockClientIds: selectedBlockClientIds,
			isValid: selectedBlockClientIds.length === 1 ?
				isBlockValid( selectedBlockClientIds[ 0 ] ) :
				null,
			mode: selectedBlockClientIds.length === 1 ?
				getBlockMode( selectedBlockClientIds[ 0 ] ) :
				null,
		};
	}, [] );

	if ( blockClientIds.length === 0 ) {
		return null;
	}

	if ( blockClientIds.length > 1 ) {
		return (
			<div className="editor-block-toolbar block-editor-block-toolbar">
				<MultiBlocksSwitcher />
				<BlockSettingsMenu clientIds={ blockClientIds } />
			</div>
		);
	}

	return (
		<div className="editor-block-toolbar block-editor-block-toolbar">
			{ mode === 'visual' && isValid && (
				<>
					{ blockClientIds.length === 1 && <BlockMobileToolbar clientId={ blockClientIds[ 0 ] } /> }
					<BlockSwitcher clientIds={ blockClientIds } />
					<BlockControls.Slot bubblesVirtually className="block-editor-block-toolbar__slot" />
					<BlockFormatControls.Slot bubblesVirtually className="block-editor-block-toolbar__slot" />
				</>
			) }
			<BlockSettingsMenu clientIds={ blockClientIds } />
		</div>
	);
}
