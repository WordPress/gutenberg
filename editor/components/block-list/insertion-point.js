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
	getBlockCount,
} from '../../store/selectors';

function BlockInsertionPoint( { showInsertionPoint } ) {
	if ( ! showInsertionPoint ) {
		return null;
	}

	return <div className="editor-block-list__insertion-point" />;
}

export default connect(
	( state, { uid, rootUID } ) => {
		const blockIndex = uid ? getBlockIndex( state, uid, rootUID ) : -1;
		const insertIndex = blockIndex > -1 ? blockIndex + 1 : getBlockCount( state );
		const insertionPoint = getBlockInsertionPoint( state );

		return {
			showInsertionPoint: (
				isBlockInsertionPointVisible( state ) &&
				insertionPoint.index === insertIndex &&
				insertionPoint.rootUID === rootUID
			),
		};
	},
)( BlockInsertionPoint );
