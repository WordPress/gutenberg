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
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { removeBlocks } from '../../store/actions';

export function BlockRemoveButton( { onRemove, onClick = noop, isLocked, small = false, ...props } ) {
	if ( isLocked ) {
		return null;
	}

	const label = __( 'Remove' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ flow( onRemove, onClick ) }
			icon="trash"
			label={ small ? label : undefined }
			{ ...props }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default compose(
	connect(
		undefined,
		( dispatch, ownProps ) => ( {
			onRemove() {
				dispatch( removeBlocks( ownProps.uids ) );
			},
		} )
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} ),
)( BlockRemoveButton );
