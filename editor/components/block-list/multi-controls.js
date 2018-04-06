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

function BlockListMultiControls( { multiSelectedBlockUids, rootUID, isSelecting, isFirst, isLast } ) {
	if ( isSelecting ) {
		return null;
	}

	return [
		<BlockMover
			key="mover"
			rootUID={ rootUID }
			uids={ multiSelectedBlockUids }
			isFirst={ isFirst }
			isLast={ isLast }
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

	const firstIndex = getBlockIndex( state, first( uids ), rootUID );
	const lastIndex = getBlockIndex( state, last( uids ), rootUID );

	return {
		multiSelectedBlockUids: uids,
		isSelecting: isMultiSelecting( state ),
		isFirst: firstIndex === 0,
		isLast: lastIndex + 1 === getBlockCount( state ),
	};
} )( BlockListMultiControls );
