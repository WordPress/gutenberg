/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { sprintf, _n, __ } from 'i18n';
import { IconButton } from 'components';

class MultiSelectHeader extends wp.element.Component {
	render() {
		const { selectedBlocks, onRemove, onDeselect } = this.props;
		const count = selectedBlocks.length;

		return (
			<header className="editor-header editor-header-multi-select">
				<div className="editor-selected-count">
					{ sprintf( _n( '%d block selected', '%d blocks selected', count ), count ) }
				</div>
				<div className="editor-selected-delete">
					<IconButton
						icon="trash"
						label={ __( 'Delete selected blocks' ) }
						onClick={ () => onRemove( selectedBlocks ) }
						focus={ true }
					>
						{ __( 'Delete' ) }
					</IconButton>
				</div>
				<div className="editor-selected-clear">
					<IconButton
						icon="no"
						label={ __( 'Clear selected blocks' ) }
						onClick={ () => onDeselect() }
					/>
				</div>
			</header>
		);
	}
}

export default connect(
	null,
	( dispatch ) => ( {
		onDeselect: () => dispatch( {
			type: 'CLEAR_SELECTED_BLOCK',
		} ),
		onRemove: ( uids ) => dispatch( {
			type: 'REMOVE_BLOCKS',
			uids,
		} ),
	} )
)( MultiSelectHeader );
