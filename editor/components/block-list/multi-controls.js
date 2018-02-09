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
} from '../../store/selectors';

function BlockListMultiControls( { multiSelectedBlockUids, rootUID, isSelecting } ) {
	if ( isSelecting ) {
		return null;
	}

	return [
		<BlockMover
			key="mover"
			rootUID={ rootUID }
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
} )( BlockListMultiControls );
