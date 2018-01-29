/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	getBlockUids,
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
	( state, { uid } ) => {
		const blockIndex = uid ? getBlockUids( state ).indexOf( uid ) : -1;
		const insertIndex = blockIndex > -1 ? blockIndex + 1 : 0;

		return {
			showInsertionPoint: (
				isBlockInsertionPointVisible( state ) &&
				getBlockInsertionPoint( state ) === insertIndex
			),
		};
	},
)( BlockInsertionPoint );
