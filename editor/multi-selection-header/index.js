/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { sprintf, _n, __ } from 'i18n';
import { IconButton } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { getMultiSelectedBlockUids } from '../selectors';
import { clearSelectedBlock } from '../actions';

function MultiSelectionHeader( { multiSelectedBlockUids, onRemove, onDeselect } ) {
	const count = multiSelectedBlockUids.length;

	if ( ! count ) {
		return null;
	}

	return (
		<div className="editor-multi-selection-header">
			<div className="editor-multi-selection-header__count">
				{ sprintf( _n( '%d block selected', '%d blocks selected', count ), count ) }
			</div>
			<div className="editor-multi-selection-header__delete">
				<IconButton
					icon="trash"
					label={ __( 'Delete selected blocks' ) }
					onClick={ () => onRemove( multiSelectedBlockUids ) }
					focus={ true }
				>
					{ __( 'Delete' ) }
				</IconButton>
			</div>
			<div className="editor-multi-selection-header__clear">
				<IconButton
					icon="no"
					label={ __( 'Clear selected blocks' ) }
					onClick={ () => onDeselect() }
				/>
			</div>
		</div>
	);
}

export default connect(
	( state ) => ( {
		multiSelectedBlockUids: getMultiSelectedBlockUids( state ),
	} ),
	( dispatch ) => ( {
		onDeselect: () => dispatch( clearSelectedBlock() ),
		onRemove: ( uids ) => dispatch( {
			type: 'REMOVE_BLOCKS',
			uids,
		} ),
	} ),
	undefined,
	{
		storeKey: 'editor',
	}
)( MultiSelectionHeader );
