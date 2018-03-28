/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { first, last } from 'lodash';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockSettingsMenu from '../block-settings-menu';
import {
	getMultiSelectedBlockUids,
	isMultiSelecting,
	getBlockIndex,
	getBlockCount,
} from '../../store/selectors';

function BlockListMultiControls( { multiSelectedBlockUids, rootUID, isSelecting, firstIndex, lastIndex, blockCount } ) {
	if ( isSelecting ) {
		return null;
	}

	return [
		<BlockMover
			key="mover"
			rootUID={ rootUID }
			uids={ multiSelectedBlockUids }
			isFirst={ firstIndex === 0 }
			isLast={ lastIndex + 1 === blockCount }
		/>,
		<BlockSettingsMenu
			key="menu"
			rootUID={ rootUID }
			uids={ multiSelectedBlockUids }
			focus
		/>,
	];
}

export default connect( ( state, ownProps ) => {
	const { rootUID } = ownProps;
	const uids = getMultiSelectedBlockUids( state );

	return {
		multiSelectedBlockUids: uids,
		isSelecting: isMultiSelecting( state ),
		firstIndex: getBlockIndex( state, first( uids ), rootUID ),
		lastIndex: getBlockIndex( state, last( uids ), rootUID ),
		blockCount: getBlockCount( state ),
	};
} )( BlockListMultiControls );
