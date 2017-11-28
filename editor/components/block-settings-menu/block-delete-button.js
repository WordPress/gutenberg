/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flow, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { removeBlocks } from '../../actions';

export function BlockDeleteButton( { onDelete, onClick = noop, isLocked, small = false } ) {
	if ( isLocked ) {
		return null;
	}

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

export default flow(
	connect(
		undefined,
		( dispatch, ownProps ) => ( {
			onDelete() {
				dispatch( removeBlocks( ownProps.uids ) );
			},
		} )
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: true === templateLock,
		};
	} ),
)( BlockDeleteButton );
