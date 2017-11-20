/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import BlockMover from '../../components/block-mover';
import BlockSettingsMenu from '../../components/block-settings-menu';
import {
	getMultiSelectedBlockUids,
	isMultiSelecting,
} from '../../state/selectors';

function VisualEditorBlockMultiControls( { multiSelectedBlockUids, isSelecting } ) {
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
			focus
		/>,
	];
}

export default connect( ( state ) => {
	return {
		multiSelectedBlockUids: getMultiSelectedBlockUids( state ),
		isSelecting: isMultiSelecting( state ),
	};
} )( VisualEditorBlockMultiControls );
