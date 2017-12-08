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

function BlockListMultiControls( { multiSelectedBlockUids, isSelecting } ) {
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
} )( BlockListMultiControls );
