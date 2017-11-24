/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockSettingsMenu from '../block-settings-menu';
import {
	getMultiSelectedBlockUids,
	isMultiSelecting,
} from '../../selectors';

function BlockListMultiControls( { multiSelectedBlockUids, isSelecting, onShowInspector } ) {
	if ( isSelecting ) {
		return null;
	}

	return [
		<BlockMover
			key="mover"
			uids={ multiSelectedBlockUids }
		/>,
		<BlockSettingsMenu
			key="menu"
			uids={ multiSelectedBlockUids }
			onShowInspector={ onShowInspector }
			focus
		/>,
	];
}

export default connect(
	( state ) => {
		return {
			multiSelectedBlockUids: getMultiSelectedBlockUids( state ),
			isSelecting: isMultiSelecting( state ),
		};
	},
	undefined,
	undefined,
	{ storeKey: 'editorStore' }
)( BlockListMultiControls );
