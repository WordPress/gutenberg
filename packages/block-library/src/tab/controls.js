/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from '../tab-panel/add-tab-toolbar-control';
import RemoveTabToolbarControl from '../tab-panel/remove-tab-toolbar-control';

export default function Controls( { tabsClientId } ) {
	return (
		<BlockControls>
			<AddTabToolbarControl tabsClientId={ tabsClientId } />
			<RemoveTabToolbarControl tabsClientId={ tabsClientId } />
		</BlockControls>
	);
}
