/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flow, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { removeBlocks } from '../../state/actions';

export function BlockDeleteButton( { onDelete, onClick = noop, small = false } ) {
	const label = __( 'Delete' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ flow( onDelete, onClick ) }
			icon="trash"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default connect(
	undefined,
	( dispatch, ownProps ) => ( {
		onDelete() {
			dispatch( removeBlocks( ownProps.uids ) );
		},
	} )
)( BlockDeleteButton );
