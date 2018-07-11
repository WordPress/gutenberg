/**
 * External dependencies
 */
import { difference } from 'lodash';

/**
 * WordPress dependencies
 */
import { IconButton } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockSettingsMenuPluginsGroup from './block-settings-menu-plugins-group';

const isEverySelectedBlockAllowed = ( selected, allowed ) => difference( selected, allowed ).length === 0;

/**
 * Plugins may want to add an item to the menu either for every block
 * or only for the specific ones provided in the `allowedBlocks` component property.
 *
 * If there are multiple blocks selected the item will be rendered if every block
 * is of one allowed type (not necesarily the same).
 *
 * @param {string[]} selectedBlockNames Array containing the names of the blocks selected
 * @param {string[]} allowedBlockNames Array containing the names of the blocks allowed
 * @return {boolean} Whether the item will be rendered or not.
 */
const shouldRenderItem = ( selectedBlockNames, allowedBlockNames ) => ! Array.isArray( allowedBlockNames ) ||
	isEverySelectedBlockAllowed( selectedBlockNames, allowedBlockNames );

const BlockSettingsMenuPluginsItem = ( { allowedBlocks, icon, label, onClick, small, role } ) => (
	<BlockSettingsMenuPluginsGroup>
		{ ( { selectedBlocks, onClose } ) => {
			if ( ! shouldRenderItem( selectedBlocks, allowedBlocks ) ) {
				return null;
			}
			return ( <IconButton
				className="editor-block-settings-menu__control"
				onClick={ compose( onClick, onClose ) }
				icon={ icon || 'admin-plugins' }
				label={ small ? label : undefined }
				role={ role }
			>
				{ ! small && label }
			</IconButton> );
		} }
	</BlockSettingsMenuPluginsGroup>
);

export default BlockSettingsMenuPluginsItem;
