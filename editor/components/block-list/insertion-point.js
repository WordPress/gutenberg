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
import {
	clearSelectedBlock,
} from '../../store/actions';

/**
 * Component showing the block's insertion point.
 *
 * @param   {Object}       props  React props passed to the component.
 * @returns {Object|false}        Rendered insertion point.
 */
function BlockListInsertionPoint( { showInsertionPoint } ) {
	return showInsertionPoint && (
		<div className="editor-block-list__insertion-point" />
	);
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
	{
		clearSelectedBlock,
	}
)( BlockListInsertionPoint );
