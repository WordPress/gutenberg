/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	getBlockIndex,
	getBlockInsertionPoint,
	isBlockInsertionPointVisible,
} from '../../store/selectors';

function BlockInsertionPoint( { showInsertionPoint } ) {
	if ( ! showInsertionPoint ) {
		return null;
	}

	return <div className="editor-block-list__insertion-point" />;
}

export default connect(
	( state, { uid, rootUID, layout } ) => {
		const blockIndex = uid ? getBlockIndex( state, uid, rootUID ) : -1;
		const insertIndex = blockIndex > -1 ? blockIndex + 1 : 0;

		return {
			showInsertionPoint: (
				isBlockInsertionPointVisible( state, rootUID, layout ) &&
				getBlockInsertionPoint( state, rootUID ) === insertIndex
			),
		};
	},
)( BlockInsertionPoint );
